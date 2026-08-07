import { DatasetIdRangeCanvasRenderer } from './dataset-id-range-canvas-renderer';
import { datasetIdRangeProfileFixture as profile } from './dataset-id-range.fixture';
import { createPlayernameIdRangeLanes } from './playername-id-range-lanes';

describe('DatasetIdRangeCanvasRenderer lanes', () => {
  afterEach(() => vi.restoreAllMocks());

  it('draws two table lanes at their shared-canvas row positions', () => {
    const context = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      lineWidth: 1,
      setTransform: vi.fn(),
      strokeRect: vi.fn(),
      strokeStyle: '',
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as never);
    const renderer = new DatasetIdRangeCanvasRenderer(document.createElement('canvas'));
    const model = createPlayernameIdRangeLanes([
      { table: 'playernames', profile },
      { table: 'dcplayernames', profile },
    ]);

    renderer.resize(640, 96, 1);
    renderer.render(
      model,
      {
        occupied: '#008000',
        holes: '#ffa500',
        capacity: '#d3d3d3',
        outOfRange: '#ff0000',
        outline: '#000000',
        surface: '#ffffff',
      },
      { camera: { center: 0.5, scale: 1 }, limits: { minScale: 1, maxScale: 1 } },
    );

    expect(context.fillRect).toHaveBeenCalledWith(expect.any(Number), 13, expect.any(Number), 32);
    expect(context.fillRect).toHaveBeenCalledWith(expect.any(Number), 51, expect.any(Number), 32);
  });
});
