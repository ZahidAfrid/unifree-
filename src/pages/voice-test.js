import Head from 'next/head';
import VoiceRecorderTest from '@/components/VoiceRecorderTest';

export default function VoiceTestPage() {
  return (
    <>
      <Head>
        <title>Voice Recorder Test | Student Freelance Platform</title>
      </Head>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto">
          <VoiceRecorderTest />
        </div>
      </div>
    </>
  );
} 