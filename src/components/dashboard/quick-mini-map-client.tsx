'use client';
import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

const QuickMiniMap = dynamic(() => import('./quick-mini-map'), { ssr: false });

export default function QuickMiniMapClient(props: ComponentProps<typeof QuickMiniMap>) {
  return <QuickMiniMap {...props} />;
}