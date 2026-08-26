import sharp from 'sharp';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

vi.mock('../_core/env', () => ({
  ENV: {
    roboflowApiKey: 'test-key',
  },
}));

vi.stubGlobal('fetch', fetchMock);

describe('codeComplyWorkflowService', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('sends Bearer auth and parses workflow outputs defensively', async () => {
    fetchMock.mockImplementation(async () => new Response(
      JSON.stringify({
        outputs: [
          {
            predictions: {
              image: { width: 100, height: 80 },
              predictions: [
                {
                  x: 50,
                  y: 40,
                  width: 20,
                  height: 10,
                  confidence: 0.91,
                  class: 'room',
                  points: [
                    { x: 10, y: 10 },
                    { x: 20, y: 10 },
                    { x: 20, y: 20 },
                    { x: 10, y: 20 },
                  ],
                },
              ],
            },
            output_image: {
              type: 'base64',
              value: Buffer.from('annotated-image').toString('base64'),
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));

    const { runCodeComplyWorkflow, getCodeComplyRoomPolygons } = await import(
      '../services/codeComplyWorkflowService'
    );

    const result = await runCodeComplyWorkflow({
      type: 'url',
      value: 'https://example.com/floorplan.png',
    });

    expect(result.outputs).toHaveLength(1);
    expect(result.outputKeys).toContain('predictions');
    expect(result.annotatedImageBuffer).toBeInstanceOf(Buffer);
    expect(result.annotatedImageBuffer?.toString()).toBe('annotated-image');

    const jpegBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).jpeg().toBuffer();

    const polygonResult = await getCodeComplyRoomPolygons(jpegBuffer);
    expect(polygonResult.length).toBe(1);
    expect(polygonResult[0].class).toBe('room');
    expect(polygonResult[0].vertices).toHaveLength(4);

    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('codecomply-vcodecomply-15-rfdetr-seg-small-t1-logic');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'Content-Type': 'application/json',
    });
    const body = JSON.parse(String(init.body));
    expect(body).not.toHaveProperty('api_key');
    expect(body.inputs.image).toEqual(
      expect.objectContaining({ type: 'url', value: 'https://example.com/floorplan.png' }),
    );
  });
});
