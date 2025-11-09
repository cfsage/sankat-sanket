'use client';
import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamically import the LiveMap component with client-side rendering only
const LiveMap = dynamic(() => import('./live-map'), { ssr: false });

export default function LiveMapClient(props: ComponentProps<typeof LiveMap>) {
  return <LiveMap {...props} />;
}