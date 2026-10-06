# HTTPS redirect deployment note

The website already uses HTTPS canonical URLs and HTTPS sitemap references.

The SEO audit warning about HTTP -> HTTPS is a server-level redirect check.

## If deployed on GitHub Pages
1. Open the GitHub repository.
2. Go to **Settings -> Pages**.
3. Confirm the custom domain is `digitalford.in`.
4. Enable **Enforce HTTPS** once GitHub reports the certificate is available.
5. Retest `http://digitalford.in/`; it should return/resolve to `https://digitalford.in/`.

GitHub Pages does not process `.htaccess`, so the repository setting is required there.

## If deployed on Apache/cPanel
The included `.htaccess` performs a permanent 301 redirect from HTTP to HTTPS and from `www.digitalford.in` to `digitalford.in`. Ensure `mod_rewrite` is enabled.

Do not use both host-level conflicting redirect rules and `.htaccess` rules that point to different preferred hostnames. The canonical host used by this project is `https://digitalford.in`.
