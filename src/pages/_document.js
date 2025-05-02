import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Initial loading styles - this will show immediately */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes pulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            
            .initial-loader {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #f9fafb;
              z-index: 9999;
              transition: opacity 0.3s;
            }
            
            .initial-loader-spinner {
              width: 50px;
              height: 50px;
              border-radius: 50%;
              border: 3px solid #e5e7eb;
              border-top-color: #4f46e5;
              animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            body {
              opacity: 0;
              transition: opacity 0.3s;
            }
            
            body.loaded {
              opacity: 1;
            }
          `
        }} />
      </Head>
      <body className="antialiased">
        {/* Initial loader that appears before JS loads */}
        <div id="initialLoader" className="initial-loader">
          <div className="initial-loader-spinner"></div>
        </div>
        
        <script dangerouslySetInnerHTML={{
          __html: `
            // Mark body as loaded after a small delay
            setTimeout(function() {
              document.body.classList.add('loaded');
              // Remove the loader after content is visible
              setTimeout(function() {
                const loader = document.getElementById('initialLoader');
                if (loader) {
                  loader.style.opacity = '0';
                  setTimeout(function() {
                    if (loader.parentNode) {
                      loader.parentNode.removeChild(loader);
                    }
                  }, 300);
                }
              }, 300);
            }, 300);
          `
        }} />
        
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
