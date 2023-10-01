import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
	const path = request.nextUrl.searchParams.get('path');
	const tag = request.nextUrl.searchParams.get('tag');
	if (path) {
		console.log('path:', path);
		if (path === '/all') {
			revalidatePath('/');
			revalidatePath('/update');
			revalidatePath('/check');
		} else {
			revalidatePath(path);
		}
		return NextResponse.json({ revalidated: true, now: Date.now(), path, message: `${path} revalidated` });
	}
	if (tag) {
		revalidateTag(tag);
		return NextResponse.json({ revalidated: true, now: Date.now(), tag, message: `${tag} revalidated` });
	}
	return NextResponse.json({
		message: 'Missing path to revalidate'
	});
}
