"use client"

import FlowEditor from '@/components/flow/FlowEditor';
import { Header } from '@/components/layout/header';

export default function Home() {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden">
        <FlowEditor />
      </div>
    </div>
  );
}
