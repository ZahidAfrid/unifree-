import Head from 'next/head';

const Meta = ({ title, description, keywords, ogImage, ogUrl }) => {
  // Default values
  const defaultTitle = 'FreeLanTalent - Student Freelance Platform';
  const defaultDescription = 'Connect with student freelancers and clients on FreeLanTalent, the premier platform for student freelancing.';
  const defaultKeywords = 'student freelancer, freelance platform, student work, remote work, freelancing';
  const defaultOgImage = '/images/og-image.jpg';
  const defaultOgUrl = 'https://freelantalent.com';

  // Use provided values or defaults
  const pageTitle = title ? `${title} | FreeLanTalent` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageKeywords = keywords || defaultKeywords;
  const pageOgImage = ogImage || defaultOgImage;
  const pageOgUrl = ogUrl || defaultOgUrl;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageOgUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageOgImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageOgUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
      <meta property="twitter:image" content={pageOgImage} />
    </Head>
  );
};

export default Meta;
