import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: { size: string } },
) {
  const sizeNum = parseInt(params.size, 10);
  if (isNaN(sizeNum) || sizeNum < 16 || sizeNum > 1024) {
    return new Response('Invalid size', { status: 400 });
  }

  const innerSize = Math.round(sizeNum * 0.65);
  const innerRadius = Math.round(sizeNum * 0.14);
  const fontSize = Math.round(sizeNum * 0.52);

  return new ImageResponse(
    (
      <div
        style={{
          width: sizeNum,
          height: sizeNum,
          background: '#0A0A0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerRadius,
            background: 'linear-gradient(135deg, #0047FF 0%, #00AAFF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'serif',
            fontSize,
            fontWeight: 900,
            color: '#FFD700',
          }}
        >
          M
        </div>
      </div>
    ),
    { width: sizeNum, height: sizeNum },
  );
}
