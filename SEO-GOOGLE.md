# SEO técnico e publicação no Google

## URLs canônicas

- Português (Brasil): https://pietro.tamanini.dev.br/
- English: https://pietro.tamanini.dev.br/en.html
- Español: https://pietro.tamanini.dev.br/es.html

## Implementado neste projeto

- Páginas HTML separadas por idioma, com conteúdo inicial traduzido — não dependem apenas da tradução executada no navegador.
- `canonical` próprio em cada versão e links `hreflang` recíprocos para `pt-BR`, `en`, `es` e `x-default`.
- Títulos e meta descriptions específicos, com tamanho controlado e linguagem natural.
- Open Graph e Twitter Cards por idioma, com imagens sociais próprias de 1200 × 630 e metadados de imagem.
- Dados estruturados Schema.org em JSON-LD (`WebSite`, `ProfilePage` e `Person`), com links oficiais, localização, imagem, descrição e áreas técnicas.
- Atualização coerente de metadados estruturados e cards sociais ao selecionar o idioma e navegar entre as versões.
- `robots.txt`, `sitemap.xml` com as três páginas, alternates `hreflang` e imagens.
- Manifest PWA, ícones SVG/PNG/Apple Touch Icon e linguagem padrão coerente.
- Links de currículo alinhados ao PDF Full Stack presente no repositório.
- Cabeçalhos de segurança e compressão definidos no `.htaccess` para servidores Apache. **Atenção:** GitHub Pages não aplica `.htaccess`; para o domínio publicado via GitHub Pages, esse arquivo não controla headers nem redirecionamentos.

## Depois de publicar

1. No Google Search Console, adicione uma **propriedade de domínio** para `pietro.tamanini.dev.br`.
2. O Search Console fornecerá um valor TXT exclusivo. Adicione esse valor no DNS do Cloudflare; não invente nem reutilize o código de outra verificação.
3. Após verificar a propriedade, abra **Sitemaps** e envie `sitemap.xml`.
4. Use **Inspeção de URL** para testar estas três URLs e solicitar indexação: `/`, `/en.html` e `/es.html`.
5. Teste os dados estruturados no Rich Results Test e confira a renderização no teste ao vivo do Search Console.
6. Analise o site no PageSpeed Insights. Corrija problemas reais de Core Web Vitals, acessibilidade e carregamento que aparecerem no relatório.
7. Confirme que o domínio personalizado está configurado nas configurações do GitHub Pages e que HTTPS está ativo.
8. Quando alterar conteúdo do site, atualize a data `lastmod` do `sitemap.xml` para a data real da alteração.

## Observações

- Metadados melhoram a compreensão e a apresentação do site, mas não garantem primeira posição nem indexação imediata.
- O Google não usa a meta tag `keywords` para ranqueamento; ela foi mantida apenas como metadado auxiliar para outros sistemas.
- A propriedade de verificação do Search Console não está pré-preenchida porque o token é exclusivo da sua conta e precisa ser gerado por você.
- O arquivo `.htaccess` é ignorado pelo GitHub Pages. Se futuramente você migrar para um host Apache, as regras de headers e compressão poderão ser consideradas por esse servidor.
