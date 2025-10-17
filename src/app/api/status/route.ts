import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type Status = { id?: string; nome: string; descricao?: string; cor?: string };

const fallback: Status[] = [
  { id: '1', nome: 'Recebido', descricao: 'Equipamento recebido para análise', cor: '#8B5CF6' },
  { id: '2', nome: 'Em Andamento', descricao: 'Serviço sendo executado', cor: '#3B82F6' },
  { id: '3', nome: 'Aguardando Peça', descricao: 'Aguardando chegada de peça', cor: '#F59E0B' },
  { id: '4', nome: 'Aguardando Orçamento', descricao: 'Aguardando aprovação do orçamento', cor: '#EC4899' },
  { id: '5', nome: 'Concluído', descricao: 'Serviço finalizado com sucesso', cor: '#10B981' },
  { id: '6', nome: 'Entregue', descricao: 'Equipamento entregue ao cliente', cor: '#059669' },
  { id: '7', nome: 'Cancelado', descricao: 'Serviço cancelado', cor: '#EF4444' },
];

export async function GET() {
  try {
    const snap = await adminDb.collection('status').get();
    if (snap.empty) {
      return NextResponse.json(fallback, { status: 200 });
    }
    const status: Status[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Status, 'id'>) }));
    return NextResponse.json(status, { status: 200 });
  } catch (err) {
    console.error('GET /api/status error:', err);
    return NextResponse.json(fallback, { status: 200 });
  }
}