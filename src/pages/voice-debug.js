import Head from 'next/head';
import VoiceRecorderDebug from '@/components/VoiceRecorderDebug';

export default function VoiceDebugPage() {
  return (
    <>
      <Head>
        <title>Voice Recorder Debug | Student Freelance Platform</title>
      </Head>
      <div className="min-h-screen bg-gray-100 py-8">
        <VoiceRecorderDebug />
      </div>
    </>
  );
} 