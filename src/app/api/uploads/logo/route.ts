import { NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebase-admin'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Primeira tentativa: Firebase Storage (se bucket existir)
    try {
      const bucket = adminStorage.bucket()
      const filename = `logos/${Date.now()}-${file.name}`.replace(/\s+/g, '-')
      const gcsFile = bucket.file(filename)
      const token = randomUUID()
      await gcsFile.save(buffer, {
        resumable: false,
        contentType: file.type || 'application/octet-stream',
        metadata: {
          contentType: file.type || 'application/octet-stream',
          metadata: { firebaseStorageDownloadTokens: token },
        },
      })
      const bucketName = bucket.name
      const encodedPath = encodeURIComponent(filename)
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`
      return NextResponse.json({ url: publicUrl, path: filename, storage: 'gcs' }, { status: 200 })
    } catch (cloudErr) {
      console.error('Upload logo error (cloud):', cloudErr)
      // Fallback: salvar em disco local sob /public/uploads/logos
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
      await fs.mkdir(uploadsDir, { recursive: true })
      const sanitized = `${Date.now()}-${file.name}`.replace(/\s+/g, '-')
      const localPath = path.join(uploadsDir, sanitized)
      await fs.writeFile(localPath, buffer)
      const publicUrl = `/uploads/logos/${sanitized}`
      return NextResponse.json({ url: publicUrl, path: `uploads/logos/${sanitized}`, storage: 'local' }, { status: 200 })
    }
  } catch (err: any) {
    console.error('Upload logo error (fatal):', err)
    return NextResponse.json({ error: 'Falha ao enviar logo', detail: String(err?.message || err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}