<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params([
    'httponly' => true,
    'secure' => $secure,
    'samesite' => 'Lax',
    'path' => '/',
]);
session_start();

$templateThumbDir = dirname(__DIR__, 2) . '/assets/images/templates';
$dataDir = __DIR__ . '/data';
$dataFile = $dataDir . '/ratings.json';

function reply(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}
function valid_template(string $id, string $thumbDir): bool {
    if (!preg_match('/^[a-z0-9][a-z0-9-]{2,79}$/', $id)) return false;
    return is_file($thumbDir . '/' . $id . '.svg');
}
function clean_state(array $state): array {
    if (!isset($state['templates']) || !is_array($state['templates'])) $state['templates'] = [];
    if (!isset($state['rate_limits']) || !is_array($state['rate_limits'])) $state['rate_limits'] = [];
    return $state;
}
function read_state(string $file): array {
    if (!is_file($file)) return ['templates'=>[], 'rate_limits'=>[]];
    $raw = @file_get_contents($file);
    if ($raw === false || $raw === '') return ['templates'=>[], 'rate_limits'=>[]];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? clean_state($decoded) : ['templates'=>[], 'rate_limits'=>[]];
}

$action = isset($_GET['action']) ? (string)$_GET['action'] : '';
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'nonce') {
    if (empty($_SESSION['df_template_nonce'])) {
        $_SESSION['df_template_nonce'] = bin2hex(random_bytes(24));
    }
    reply(['ok'=>true, 'nonce'=>$_SESSION['df_template_nonce']]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'summary') {
    $template = isset($_GET['template']) ? preg_replace('/[^a-z0-9-]/', '', strtolower((string)$_GET['template'])) : '';
    if (!valid_template($template, $templateThumbDir)) reply(['ok'=>false, 'message'=>'Invalid template.'], 400);
    $state = read_state($dataFile);
    $row = $state['templates'][$template] ?? ['sum'=>0,'count'=>0];
    reply(['ok'=>true, 'sum'=>(int)($row['sum'] ?? 0), 'count'=>(int)($row['count'] ?? 0)]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(['ok'=>false, 'message'=>'Method not allowed.'], 405);

$nonce = isset($_POST['nonce']) ? (string)$_POST['nonce'] : '';
if (empty($_SESSION['df_template_nonce']) || !hash_equals((string)$_SESSION['df_template_nonce'], $nonce)) {
    reply(['ok'=>false, 'message'=>'Security validation failed.'], 403);
}

$template = isset($_POST['template']) ? preg_replace('/[^a-z0-9-]/', '', strtolower((string)$_POST['template'])) : '';
$rating = filter_input(INPUT_POST, 'rating', FILTER_VALIDATE_INT, ['options'=>['min_range'=>1,'max_range'=>5]]);
if (!valid_template($template, $templateThumbDir) || $rating === false || $rating === null) reply(['ok'=>false, 'message'=>'Invalid rating submission.'], 400);

if (!is_dir($dataDir) && !@mkdir($dataDir, 0750, true)) reply(['ok'=>false, 'message'=>'Rating storage is unavailable.'], 503);
if (!is_file($dataFile)) @file_put_contents($dataFile, json_encode(['templates'=>[], 'rate_limits'=>[]]), LOCK_EX);

$fp = @fopen($dataFile, 'c+');
if (!$fp) reply(['ok'=>false, 'message'=>'Rating storage is unavailable.'], 503);
if (!flock($fp, LOCK_EX)) { fclose($fp); reply(['ok'=>false, 'message'=>'Rating storage is busy.'], 503); }
rewind($fp);
$raw = stream_get_contents($fp);
$state = $raw ? json_decode($raw, true) : null;
$state = is_array($state) ? clean_state($state) : ['templates'=>[], 'rate_limits'=>[]];

$now = time();
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'), 0, 300);
$visitorHash = hash('sha256', $ip . '|' . $ua . '|' . __FILE__);
$ipHash = hash('sha256', $ip . '|' . __FILE__);

// Basic abuse protection: no more than 25 rating submissions from the same IP per hour.
$recent = array_values(array_filter((array)($state['rate_limits'][$ipHash] ?? []), fn($ts) => is_int($ts) && $ts > $now - 3600));
if (count($recent) >= 25) {
    flock($fp, LOCK_UN); fclose($fp); reply(['ok'=>false, 'message'=>'Too many rating attempts. Please try again later.'], 429);
}
$recent[] = $now;
$state['rate_limits'][$ipHash] = $recent;

if (!isset($state['templates'][$template]) || !is_array($state['templates'][$template])) {
    $state['templates'][$template] = ['sum'=>0,'count'=>0,'votes'=>[]];
}
$row =& $state['templates'][$template];
if (!isset($row['votes']) || !is_array($row['votes'])) $row['votes'] = [];

// One rating per template per browser/IP signature every 30 days.
if (isset($row['votes'][$visitorHash]) && (int)($row['votes'][$visitorHash]['time'] ?? 0) > $now - 2592000) {
    $sum = (int)($row['sum'] ?? 0); $count = (int)($row['count'] ?? 0);
    flock($fp, LOCK_UN); fclose($fp); reply(['ok'=>false,'code'=>'duplicate','message'=>'You already rated this template recently.','sum'=>$sum,'count'=>$count], 409);
}

$row['sum'] = (int)($row['sum'] ?? 0) + (int)$rating;
$row['count'] = (int)($row['count'] ?? 0) + 1;
$row['votes'][$visitorHash] = ['rating'=>(int)$rating,'time'=>$now];

// Limit stored vote fingerprints to recent entries only.
foreach ($row['votes'] as $hash => $vote) {
    if ((int)($vote['time'] ?? 0) < $now - 7776000) unset($row['votes'][$hash]);
}

rewind($fp); ftruncate($fp, 0);
$encoded = json_encode($state, JSON_UNESCAPED_SLASHES);
if ($encoded === false || fwrite($fp, $encoded) === false) {
    flock($fp, LOCK_UN); fclose($fp); reply(['ok'=>false,'message'=>'Could not save rating.'], 500);
}
fflush($fp); flock($fp, LOCK_UN); fclose($fp);
reply(['ok'=>true,'sum'=>(int)$row['sum'],'count'=>(int)$row['count'],'message'=>'Thanks for rating this template!']);
