<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params(['httponly'=>true,'secure'=>$secure,'samesite'=>'Lax','path'=>'/']);
session_start();

function reply(array $payload, int $status=200): void { http_response_code($status); echo json_encode($payload, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE); exit; }
function clean_string($v, int $max=800): string { $s=trim(strip_tags((string)$v)); $s=preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u','',$s) ?? ''; return function_exists('mb_substr') ? mb_substr($s,0,$max) : substr($s,0,$max); }
function clean_list($v, int $maxItems=12): array { if(!is_array($v)) return []; $out=[]; foreach(array_slice($v,0,$maxItems) as $x){$s=clean_string($x,120); if($s!=='')$out[]=$s;} return $out; }

$action=(string)($_GET['action'] ?? '');
if($_SERVER['REQUEST_METHOD']==='GET' && $action==='nonce'){
  if(empty($_SESSION['df_ai_builder_nonce'])) $_SESSION['df_ai_builder_nonce']=bin2hex(random_bytes(24));
  reply(['ok'=>true,'nonce'=>$_SESSION['df_ai_builder_nonce']]);
}
if($_SERVER['REQUEST_METHOD']!=='POST') reply(['ok'=>false,'message'=>'Method not allowed.'],405);
$nonce=(string)($_POST['nonce'] ?? '');
if(empty($_SESSION['df_ai_builder_nonce']) || !hash_equals((string)$_SESSION['df_ai_builder_nonce'],$nonce)) reply(['ok'=>false,'message'=>'Security validation failed.'],403);

// Simple session rate limit: max 8 generations per 30 minutes.
$now=time(); $runs=array_values(array_filter((array)($_SESSION['df_ai_runs'] ?? []), fn($t)=>is_int($t)&&$t>$now-1800));
if(count($runs)>=8) reply(['ok'=>false,'message'=>'Generation limit reached. Please try again later.'],429);
$runs[]=$now; $_SESSION['df_ai_runs']=$runs;

// Additional hashed-IP limit to reduce API-cost abuse across fresh sessions.
$rateDir=__DIR__.'/data'; $rateFile=$rateDir.'/ai-rate.json';
if(!is_dir($rateDir)) @mkdir($rateDir,0750,true);
$ip=(string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'); $ipHash=hash('sha256',$ip.'|'.__FILE__);
if(is_dir($rateDir)){
  $fp=@fopen($rateFile,'c+');
  if($fp && flock($fp,LOCK_EX)){
    rewind($fp); $rateRaw=stream_get_contents($fp); $rateState=$rateRaw?json_decode($rateRaw,true):[]; if(!is_array($rateState))$rateState=[];
    foreach($rateState as $h=>$times){$times=array_values(array_filter((array)$times,fn($t)=>is_int($t)&&$t>$now-3600)); if($times)$rateState[$h]=$times; else unset($rateState[$h]);}
    $ipRuns=(array)($rateState[$ipHash]??[]);
    if(count($ipRuns)>=20){flock($fp,LOCK_UN);fclose($fp);reply(['ok'=>false,'message'=>'Too many generation requests from this network. Please try again later.'],429);}
    $ipRuns[]=$now;$rateState[$ipHash]=$ipRuns;rewind($fp);ftruncate($fp,0);fwrite($fp,json_encode($rateState));fflush($fp);flock($fp,LOCK_UN);fclose($fp);
  }
}

$raw=(string)($_POST['payload'] ?? '');
if(strlen($raw)>50000) reply(['ok'=>false,'message'=>'Request is too large.'],413);
$data=json_decode($raw,true); if(!is_array($data)) reply(['ok'=>false,'message'=>'Invalid request.'],400);

$clean=[
 'businessName'=>clean_string($data['businessName']??'',120),
 'businessType'=>clean_string($data['businessType']??'Products + Services',80),
 'category'=>clean_string($data['category']??'',100),
 'description'=>clean_string($data['description']??'',1800),
 'location'=>clean_string($data['location']??'',160),
 'websiteUrl'=>clean_string($data['websiteUrl']??'',240),
 'phone'=>clean_string($data['phone']??'',60), 'whatsapp'=>clean_string($data['whatsapp']??'',60), 'email'=>clean_string($data['email']??'',160), 'address'=>clean_string($data['address']??'',260),
 'audiences'=>clean_list($data['audiences']??[],12), 'idealCustomer'=>clean_string($data['idealCustomer']??'',900), 'goals'=>clean_list($data['goals']??[],12),
 'style'=>clean_string($data['style']??'Modern',60), 'colorPreference'=>clean_string($data['colorPreference']??'Suggested by AI',60),
 'primaryColor'=>clean_string($data['primaryColor']??'',20), 'accentColor'=>clean_string($data['accentColor']??'',20),
 'regenerationMode'=>clean_string($data['regenerationMode']??'',30),
 'variationIndex'=>max(0,min(20,(int)($data['variationIndex']??0)))
];
if($clean['businessName']===''||$clean['businessType']===''||$clean['category']===''||$clean['description']===''||$clean['location']==='') reply(['ok'=>false,'message'=>'Required business details are missing.'],400);

$apiKey=(string)(getenv('OPENAI_API_KEY') ?: '');
if($apiKey==='') reply(['ok'=>false,'code'=>'not_configured','message'=>'AI service is not configured on this server.'],503);
if(!function_exists('curl_init')) reply(['ok'=>false,'message'=>'Server cURL support is unavailable.'],503);
$model=(string)(getenv('OPENAI_MODEL') ?: 'gpt-5.6-luna');

$schema=[
 'type'=>'object','additionalProperties'=>false,
 'properties'=>[
   'brand'=>['type'=>'object','additionalProperties'=>false,'properties'=>[
     'name'=>['type'=>'string'],'tagline'=>['type'=>'string'],'intro'=>['type'=>'string'],'primary'=>['type'=>'string'],'accent'=>['type'=>'string']],
     'required'=>['name','tagline','intro','primary','accent']],
   'seo'=>['type'=>'object','additionalProperties'=>false,'properties'=>['title'=>['type'=>'string'],'description'=>['type'=>'string']],'required'=>['title','description']],
   'hero'=>['type'=>'object','additionalProperties'=>false,'properties'=>[
     'eyebrow'=>['type'=>'string'],'heading'=>['type'=>'string'],'subheading'=>['type'=>'string'],'primaryCta'=>['type'=>'string'],'secondaryCta'=>['type'=>'string']],
     'required'=>['eyebrow','heading','subheading','primaryCta','secondaryCta']],
   'sections'=>['type'=>'array','items'=>['type'=>'object','additionalProperties'=>false,'properties'=>[
     'type'=>['type'=>'string','enum'=>['products','services','offers','benefits','about','content','portfolio','process','testimonials','gallery']], 'title'=>['type'=>'string'],'intro'=>['type'=>'string'],
     'items'=>['type'=>'array','items'=>['type'=>'object','additionalProperties'=>false,'properties'=>['title'=>['type'=>'string'],'description'=>['type'=>'string'],'meta'=>['type'=>'string'],'imageKeyword'=>['type'=>'string']],'required'=>['title','description','meta','imageKeyword']]]
   ],'required'=>['type','title','intro','items']]],
   'contact'=>['type'=>'object','additionalProperties'=>false,'properties'=>['phone'=>['type'=>'string'],'whatsapp'=>['type'=>'string'],'email'=>['type'=>'string'],'address'=>['type'=>'string']],'required'=>['phone','whatsapp','email','address']],
   'visualLabel'=>['type'=>'string'],'style'=>['type'=>'string']
 ],
 'required'=>['brand','seo','hero','sections','contact','visualLabel','style']
];

$businessJson=json_encode($clean,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
$instructions='You are a senior website strategist, conversion copywriter, local SEO writer and UX architect. The user provides only basic business details, business type, category, location and a natural-language description that may mention what they sell and the services they offer. Infer a useful, realistic website draft from that information. Write natural human-sounding copy for real customers: specific, clear and conversational, without robotic phrases, keyword stuffing or exaggerated claims. Create separate Products and/or Services sections when appropriate for the businessType. Generate 3 to 6 relevant product or service names per important section, useful one-to-two sentence descriptions, and sensible SAMPLE/DEMO price labels using a location-appropriate currency. Prices are editable draft suggestions, not claims about the real business. SEO title should be concise and naturally combine the brand, core category or offering and location where useful. Meta description should read like a helpful search snippet, normally about 140-160 characters, and accurately reflect the generated page content. Do not invent awards, years in business, ratings, certifications, medical claims, guarantees, discounts, customer counts or factual credentials. Preserve provided contact details exactly. Choose clear CTAs and enough varied content to support an ultra-premium multi-page website rather than a thin landing page. Cover the most important customer questions, product/service discovery needs, business story and conversion intent without filler or unsupported claims. For each product/service item, return a short imageKeyword describing the kind of realistic photo that would fit it. Choose sensible hex brand colors unless custom colors were supplied. Return only the requested structured output.';
if($clean['regenerationMode']==='fresh' && $clean['variationIndex']>0){$instructions.=' This is regeneration attempt #'.$clean['variationIndex'].'. Produce a meaningfully different alternative from a typical first draft: vary the positioning angle, hero wording, section emphasis, product/service descriptions and CTA phrasing while staying faithful to the same business facts. Do not merely paraphrase the previous-style output. Keep all claims supportable and preserve provided contact details.';}
$input="Create a website concept from this business brief:\n".$businessJson;
$body=[
 'model'=>$model,
 'instructions'=>$instructions,
 'input'=>$input,
 'max_output_tokens'=>5500,
 'text'=>['format'=>['type'=>'json_schema','name'=>'digitalford_website_concept','strict'=>true,'schema'=>$schema]]
];

$ch=curl_init('https://api.openai.com/v1/responses');
curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>45,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$apiKey,'Content-Type: application/json'],CURLOPT_POSTFIELDS=>json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)]);
$response=curl_exec($ch); $http=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE); $err=curl_error($ch); curl_close($ch);
if($response===false || $err!=='') reply(['ok'=>false,'message'=>'AI service could not be reached.'],502);
$decoded=json_decode($response,true);
if($http<200||$http>=300){ $msg=clean_string($decoded['error']['message']??'AI generation failed.',220); reply(['ok'=>false,'message'=>$msg],502); }
$text='';
if(isset($decoded['output_text'])&&is_string($decoded['output_text'])) $text=$decoded['output_text'];
if($text==='') foreach((array)($decoded['output']??[]) as $item){ if(($item['type']??'')!=='message')continue; foreach((array)($item['content']??[]) as $part){ if(($part['type']??'')==='output_text'&&isset($part['text'])){$text=(string)$part['text'];break 2;} } }
$concept=json_decode($text,true); if(!is_array($concept)) reply(['ok'=>false,'message'=>'AI returned an invalid website concept.'],502);
reply(['ok'=>true,'mode'=>'ai','concept'=>$concept]);
