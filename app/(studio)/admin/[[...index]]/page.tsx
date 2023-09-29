'use client';

import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import schemas from '@/sanity/schemas';
import clientConfig from '@/sanity.config';
import { NextStudio } from 'next-sanity/studio';

const config = defineConfig({
	...clientConfig,
	basePath: '/admin',
	plugins: [deskTool()],
	schema: { types: schemas }
});

export default function Admin() {
	return <NextStudio config={config} />;
}
