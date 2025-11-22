// app/api/upload-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const filename = formData.get('filename') as string;

    if (!image || !filename) {
      return NextResponse.json(
        { error: 'Image and filename are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the images directory exists
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    try {
      await mkdir(imagesDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, that's fine
    }

    // Save the file
    const filePath = path.join(imagesDir, filename);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      path: `/images/${filename}`,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}