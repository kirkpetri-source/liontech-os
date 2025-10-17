import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type Categoria = { id?: string; nome: string; descricao?: string };

const fallback: Categoria[] = [
  { id: '1', nome: 'Notebooks', descricao: 'Serviços para notebooks e laptops' },
  { id: '2', nome: 'Desktops', descricao: 'Manutenção em computadores de mesa' },
  { id: '3', nome: 'Smartphones', descricao: 'Reparos em celulares e smartphones' },
  { id: '4', nome: 'Tablets', descricao: 'Serviços para tablets' },
  { id: '5', nome: 'Monitores', descricao: 'Reparos em monitores e telas' },
  { id: '6', nome: 'Impressoras', descricao: 'Manutenção em impressoras' },
  { id: '7', nome: 'Outros', descricao: 'Outros tipos de equipamentos' },
];

export async function GET() {
  try {
    const snap = await adminDb.collection('categorias').get();
    if (snap.empty) {
      return NextResponse.json(fallback, { status: 200 });
    }
    const categorias: Categoria[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Categoria, 'id'>) }));
    return NextResponse.json(categorias, { status: 200 });
  } catch (err) {
    console.error('GET /api/categorias error:', err);
    return NextResponse.json(fallback, { status: 200 });
  }
}