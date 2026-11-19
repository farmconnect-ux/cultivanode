import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  (globalThis as Record<string, unknown>).__DEV__ = false;
});

vi.mock('expo-crypto', () => ({
  randomUUID: () => '00000000-0000-4000-8000-000000000099',
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
    storage: { from: vi.fn() },
  },
}));

// Lightweight React hook harness for testing React Native components in Node Vitest
const hookState: {
  states: unknown[];
  refs: Array<{ current: unknown }>;
  idx: number;
  refIdx: number;
  effects: Array<() => void | (() => void)>;
} = {
  states: [],
  refs: [],
  idx: 0,
  refIdx: 0,
  effects: [],
};

function resetHooks() {
  hookState.states = [];
  hookState.refs = [];
  hookState.idx = 0;
  hookState.refIdx = 0;
  hookState.effects = [];
}

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    default: actual,
    useState: <T,>(init: T | (() => T)) => {
      const i = hookState.idx++;
      if (!(i in hookState.states)) {
        hookState.states[i] = typeof init === 'function' ? (init as () => T)() : init;
      }
      const setState = (next: T | ((prev: T) => T)) => {
        hookState.states[i] =
          typeof next === 'function' ? (next as (prev: T) => T)(hookState.states[i] as T) : next;
      };
      return [hookState.states[i] as T, setState] as const;
    },
    useRef: <T,>(init: T) => {
      const i = hookState.refIdx++;
      if (!(i in hookState.refs)) {
        hookState.refs[i] = { current: init };
      }
      return hookState.refs[i] as { current: T };
    },
    useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    useEffect: (fn: () => void | (() => void)) => {
      hookState.effects.push(fn);
    },
  };
});

const mockAlert = vi.fn();
const mockRouterReplace = vi.fn();
const mockRouterBack = vi.fn();
const mockRouterCanGoBack = vi.fn(() => false);
const mockLaunchCamera = vi.fn();
const mockRequestCameraPermissions = vi.fn();
const mockSubmitWorkProofPhoto = vi.fn();
const mockFinishJobWork = vi.fn();
const mockCheckInJob = vi.fn();
const mockLoadProviderJobById = vi.fn();
let mockGpsCallback: ((r: { latitude: number; longitude: number; accuracy: number; timestamp: number }) => void) | null = null;
let mockSessionValue: {
  session: unknown;
  account: { roles: Array<{ role: string }> } | null | undefined;
  loadFailed: boolean;
  refresh: () => void;
} = {
  session: { user: { id: 'provider-1' } },
  account: { roles: [{ role: 'machinery_owner' }] },
  loadFailed: false,
  refresh: vi.fn(),
};
let mockRouteParams: { jobId?: string } = { jobId: '11111111-1111-4111-8111-111111111111' };

vi.mock('react-native', () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
  FlatList: ({ data }: { data: unknown[] }) => React.createElement('FlatList', { data }),
  Image: (props: Record<string, unknown>) => React.createElement('Image', props),
  Pressable: (props: Record<string, unknown>) => React.createElement('Pressable', props),
  StyleSheet: { create: <T extends Record<string, unknown>>(s: T) => s },
  View: (props: Record<string, unknown>) => React.createElement('View', props),
}));

vi.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: () => mockRequestCameraPermissions(),
  launchCameraAsync: () => mockLaunchCamera(),
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => mockRouteParams,
  useRouter: () => ({
    replace: mockRouterReplace,
    back: mockRouterBack,
    canGoBack: mockRouterCanGoBack,
  }),
}));

vi.mock('@cultivanode/shared', () => ({
  colors: {
    leaf: { 50: '#f0fdf4', 200: '#bbf7d0', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d' },
    soil: { 700: '#44403c', 900: '#1c1917' },
  },
  formatNaira: (n: number) => `₦${n}`,
  radius: { sm: 4, md: 8, lg: 12, full: 999 },
  space: [0, 4, 8, 12, 16, 20, 24],
}));

vi.mock('../../lib/gps-tracker', () => ({
  BoundaryTracker: class {
    constructor(cb: (r: { latitude: number; longitude: number; accuracy: number; timestamp: number }) => void) {
      mockGpsCallback = cb;
    }
    start() {
      return Promise.resolve(true);
    }
    stop() {}
  },
}));

vi.mock('../../lib/provider-dispatch', async () => {
  const actual = await vi.importActual<typeof import('../../lib/provider-dispatch')>('../../lib/provider-dispatch');
  return {
    ...actual,
    loadProviderJobById: (...args: unknown[]) => mockLoadProviderJobById(...args),
    submitWorkProofPhoto: (...args: unknown[]) => mockSubmitWorkProofPhoto(...args),
    finishJobWork: (...args: unknown[]) => mockFinishJobWork(...args),
    checkInJob: (...args: unknown[]) => mockCheckInJob(...args),
  };
});

vi.mock('../../lib/session', () => ({
  useSession: () => mockSessionValue,
}));

vi.mock('../../ui', () => ({
  Button: (props: Record<string, unknown>) => React.createElement('Button', props),
  Card: (props: Record<string, unknown>) => React.createElement('Card', props),
  Notice: (props: Record<string, unknown>) => React.createElement('Notice', props),
  Screen: (props: Record<string, unknown>) => React.createElement('Screen', props),
  Text: (props: Record<string, unknown>) => React.createElement('Text', props),
  TextField: (props: Record<string, unknown>) => React.createElement('TextField', props),
}));

function findElements(
  node: unknown,
  predicate: (el: React.ReactElement<Record<string, unknown>>) => boolean,
  acc: Array<React.ReactElement<Record<string, unknown>>> = []
): Array<React.ReactElement<Record<string, unknown>>> {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) {
    for (const child of node) findElements(child, predicate, acc);
    return acc;
  }
  const el = node as React.ReactElement<Record<string, unknown>>;
  if (predicate(el)) acc.push(el);
  if (el.props && 'children' in el.props) {
    findElements(el.props.children, predicate, acc);
  }
  return acc;
}

function findButtonByTitle(tree: unknown, titlePart: string) {
  return findElements(
    tree,
    (el) => typeof el.props?.title === 'string' && el.props.title.includes(titlePart)
  )[0];
}

const SAMPLE_JOB = {
  id: '11111111-1111-4111-8111-111111111111',
  jobTitle: 'Tractor Ploughing',
  farmName: 'Ibadan North Farm',
  farmerName: 'Ade Farmer',
  farmerPhone: '2348011111111',
  scheduledDate: '2026-11-20',
  status: 'in_progress',
  quantity: 4,
  unit: 'hectare',
  totalAmountNgn: 120000,
  checkedInAt: '2026-11-20T08:00:00Z',
  farmLat: 7.37,
  farmLng: 3.94,
  locationText: 'Oyo State',
};

describe('EvidenceRoute (/evidence/[jobId]) authorisation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHooks();
    mockRouteParams = { jobId: SAMPLE_JOB.id };
    mockSessionValue = {
      session: { user: { id: 'provider-1' } },
      account: { roles: [{ role: 'machinery_owner' }] },
      loadFailed: false,
      refresh: vi.fn(),
    };
  });

  it('allows authenticated machinery_owner with assigned job access', async () => {
    const { default: EvidenceRoute } = await import('../../app/evidence/[jobId]');
    mockLoadProviderJobById.mockResolvedValue({ ok: true, data: SAMPLE_JOB });

    const renderRoute = () => {
      hookState.idx = 0;
      hookState.refIdx = 0;
      hookState.effects = [];
      return EvidenceRoute();
    };

    renderRoute();
    await hookState.effects[0]?.();
    const tree = renderRoute();

    expect(mockLoadProviderJobById).toHaveBeenCalledWith(SAMPLE_JOB.id);
    const screen = findElements(tree, (el) => typeof el.type === 'function' && el.type.name === 'WorkEvidenceScreen');
    expect(screen).toHaveLength(1);
  });

  it('preserves access for authenticated service_provider with assigned job', async () => {
    const { default: EvidenceRoute } = await import('../../app/evidence/[jobId]');
    mockSessionValue.account = { roles: [{ role: 'service_provider' }] };
    mockLoadProviderJobById.mockResolvedValue({ ok: true, data: SAMPLE_JOB });

    const renderRoute = () => {
      hookState.idx = 0;
      hookState.refIdx = 0;
      hookState.effects = [];
      return EvidenceRoute();
    };

    renderRoute();
    await hookState.effects[0]?.();
    const tree = renderRoute();

    expect(mockLoadProviderJobById).toHaveBeenCalledWith(SAMPLE_JOB.id);
    const screen = findElements(tree, (el) => typeof el.type === 'function' && el.type.name === 'WorkEvidenceScreen');
    expect(screen).toHaveLength(1);
  });

  it('denies unrelated authenticated users, specialities, and unauthenticated visitors', async () => {
    const { default: EvidenceRoute } = await import('../../app/evidence/[jobId]');

    // Unrelated role (crop_farmer)
    mockSessionValue.account = { roles: [{ role: 'crop_farmer' }] };
    hookState.idx = 0;
    let tree = EvidenceRoute();
    expect(JSON.stringify(tree)).toContain('Provider Access Required');
    expect(mockLoadProviderJobById).not.toHaveBeenCalled();

    // Provider speciality confused as role
    resetHooks();
    mockSessionValue.account = { roles: [{ role: 'machine_operator' }] };
    tree = EvidenceRoute();
    expect(JSON.stringify(tree)).toContain('Provider Access Required');

    // Unauthenticated
    resetHooks();
    mockSessionValue.session = null;
    mockSessionValue.account = null;
    tree = EvidenceRoute();
    expect(JSON.stringify(tree)).toContain('Please sign in to access provider work evidence.');
  });

  it('denies machinery_owner without assigned job relationship', async () => {
    const { default: EvidenceRoute } = await import('../../app/evidence/[jobId]');
    mockLoadProviderJobById.mockResolvedValue({
      ok: false,
      kind: 'forbidden',
      message: 'Your account does not have provider access to these records.',
    });

    const renderRoute = () => {
      hookState.idx = 0;
      hookState.refIdx = 0;
      hookState.effects = [];
      return EvidenceRoute();
    };

    renderRoute();
    await hookState.effects[0]?.();
    const tree = renderRoute();

    expect(JSON.stringify(tree)).toContain('Unable to Open Job');
    const screen = findElements(tree, (el) => typeof el.type === 'function' && el.type.name === 'WorkEvidenceScreen');
    expect(screen).toHaveLength(0);
  });
});

describe('WorkEvidenceScreen photo submission and job completion reliability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHooks();
    mockGpsCallback = null;
    mockRequestCameraPermissions.mockResolvedValue({ granted: true });
    mockLaunchCamera.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/proof.jpg' }],
    });
  });

  async function setupScreenWithPhotoAndGps() {
    const { WorkEvidenceScreen } = await import('../WorkEvidenceScreen');
    const onBack = vi.fn();
    const onJobUpdated = vi.fn();

    const render = () => {
      hookState.idx = 0;
      hookState.refIdx = 0;
      hookState.effects = [];
      return WorkEvidenceScreen({ job: SAMPLE_JOB as never, onBack, onJobUpdated });
    };

    let tree = render();
    hookState.effects.forEach((fn) => fn());
    mockGpsCallback?.({ latitude: 7.37, longitude: 3.94, accuracy: 5, timestamp: 1700000000000 });
    tree = render();

    const takePhotoBtn = findButtonByTitle(tree, 'Take Live Photo');
    await (takePhotoBtn.props.onPress as () => Promise<void>)();
    tree = render();

    return { render, tree, onBack, onJobUpdated };
  }

  it('shows failure alert, preserves photo, and allows retry when submitWorkProofPhoto returns { success: false }', async () => {
    const { render, tree, onJobUpdated } = await setupScreenWithPhotoAndGps();
    mockSubmitWorkProofPhoto.mockResolvedValueOnce({ success: false, error: 'Storage upload failed' });

    const uploadBtn = findButtonByTitle(tree, 'Upload Proof Photo');
    await (uploadBtn.props.onPress as () => Promise<void>)();

    expect(mockAlert).toHaveBeenCalledWith('Upload Failed', 'Storage upload failed');
    expect(mockAlert).not.toHaveBeenCalledWith('Evidence Uploaded', expect.anything());
    expect(onJobUpdated).not.toHaveBeenCalled();

    // Photo is preserved and retry succeeds
    const afterFailTree = render();
    const retryBtn = findButtonByTitle(afterFailTree, 'Upload Proof Photo');
    expect(retryBtn).toBeDefined();
    expect(retryBtn.props.disabled).toBe(false);

    mockSubmitWorkProofPhoto.mockResolvedValueOnce({ success: true, path: 'booking-proofs/ok.jpg' });
    await (retryBtn.props.onPress as () => Promise<void>)();

    expect(mockAlert).toHaveBeenCalledWith('Evidence Uploaded', 'BEFORE photo verified with GPS.');
    expect(onJobUpdated).toHaveBeenCalledTimes(1);
    const afterOkTree = render();
    expect(JSON.stringify(afterOkTree)).toContain('ATTACHED PROOFS (');
  });

  it('handles thrown exception in submitWorkProofPhoto without false success and resets loading', async () => {
    const { render, tree, onJobUpdated } = await setupScreenWithPhotoAndGps();
    mockSubmitWorkProofPhoto.mockRejectedValueOnce(new Error('Network timeout'));

    const uploadBtn = findButtonByTitle(tree, 'Upload Proof Photo');
    await (uploadBtn.props.onPress as () => Promise<void>)();

    expect(mockAlert).toHaveBeenCalledWith(
      'Upload Failed',
      'Could not upload work proof photo. Please try again.'
    );
    expect(mockAlert).not.toHaveBeenCalledWith('Evidence Uploaded', expect.anything());
    expect(onJobUpdated).not.toHaveBeenCalled();

    const afterThrowTree = render();
    const retryBtn = findButtonByTitle(afterThrowTree, 'Upload Proof Photo');
    expect(retryBtn.props.loading).toBe(false);
    expect(retryBtn.props.disabled).toBe(false);
  });

  it('prevents duplicate concurrent photo upload submissions while loading', async () => {
    const { render, tree } = await setupScreenWithPhotoAndGps();
    let resolveUpload!: (val: { success: boolean; path?: string }) => void;
    mockSubmitWorkProofPhoto.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        })
    );

    const uploadBtn = findButtonByTitle(tree, 'Upload Proof Photo');
    const firstPromise = (uploadBtn.props.onPress as () => Promise<void>)();
    const loadingTree = render();
    const loadingBtn = findButtonByTitle(loadingTree, 'Uploading...');
    expect(loadingBtn.props.loading).toBe(true);
    expect(loadingBtn.props.disabled).toBe(true);

    // Concurrent second press is ignored
    await (loadingBtn.props.onPress as () => Promise<void>)();
    expect(mockSubmitWorkProofPhoto).toHaveBeenCalledTimes(1);

    resolveUpload({ success: true, path: 'ok.jpg' });
    await firstPromise;
  });

  it('handles finishJobWork failure, exception, duplicate press, retry, and confirmed success', async () => {
    const { render, tree, onBack, onJobUpdated } = await setupScreenWithPhotoAndGps();

    // Upload BEFORE then AFTER photos
    mockSubmitWorkProofPhoto.mockResolvedValue({ success: true, path: 'ok.jpg' });
    await (findButtonByTitle(tree, 'Upload Proof Photo').props.onPress as () => Promise<void>)();
    let currentTree = render();

    await (findButtonByTitle(currentTree, 'Take Live Photo').props.onPress as () => Promise<void>)();
    currentTree = render();
    await (findButtonByTitle(currentTree, 'Upload Proof Photo').props.onPress as () => Promise<void>)();
    currentTree = render();

    // 1. Failed finishJobWork -> no success alert, no navigation, job preserved
    mockFinishJobWork.mockResolvedValueOnce({ success: false, error: 'RPC permission denied' });
    (findButtonByTitle(currentTree, 'Hand Over Work to Farmer').props.onPress as () => void)();
    const confirmCall = mockAlert.mock.calls.find((c) => c[0] === 'Hand Over Work?');
    const confirmAction = (confirmCall?.[2] as Array<{ text: string; onPress?: () => Promise<void> }>).find(
      (b) => b.text === 'Confirm & Handover'
    );
    await confirmAction?.onPress?.();

    expect(mockAlert).toHaveBeenCalledWith('Handover Failed', 'RPC permission denied');
    expect(mockAlert).not.toHaveBeenCalledWith('Work Handed Over!', expect.anything());
    expect(mockAlert).not.toHaveBeenCalledWith('Work Submitted', expect.anything());
    expect(onBack).not.toHaveBeenCalled();

    // 2. Thrown exception -> no success alert, loading resets
    mockFinishJobWork.mockRejectedValueOnce(new Error('Connection reset'));
    currentTree = render();
    (findButtonByTitle(currentTree, 'Hand Over Work to Farmer').props.onPress as () => void)();
    const confirmCall2 = mockAlert.mock.calls.filter((c) => c[0] === 'Hand Over Work?').pop();
    const confirmAction2 = (confirmCall2?.[2] as Array<{ text: string; onPress?: () => Promise<void> }>).find(
      (b) => b.text === 'Confirm & Handover'
    );
    await confirmAction2?.onPress?.();
    expect(mockAlert).toHaveBeenCalledWith(
      'Handover Failed',
      'Could not submit work handover. Please try again.'
    );
    expect(onBack).not.toHaveBeenCalled();

    // 3. Concurrent duplicate press blocked + confirmed success navigates back
    let resolveFinish!: (val: { success: boolean }) => void;
    mockFinishJobWork.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFinish = resolve;
        })
    );
    currentTree = render();
    (findButtonByTitle(currentTree, 'Hand Over Work to Farmer').props.onPress as () => void)();
    const confirmCall3 = mockAlert.mock.calls.filter((c) => c[0] === 'Hand Over Work?').pop();
    const confirmAction3 = (confirmCall3?.[2] as Array<{ text: string; onPress?: () => Promise<void> }>).find(
      (b) => b.text === 'Confirm & Handover'
    );
    const p1 = confirmAction3?.onPress?.();
    const p2 = confirmAction3?.onPress?.();
    const finishingTree = render();
    const finishingBtn = findButtonByTitle(finishingTree, 'Submitting Handover...');
    expect(finishingBtn.props.loading).toBe(true);
    expect(finishingBtn.props.disabled).toBe(true);
    expect(mockFinishJobWork).toHaveBeenCalledTimes(3); // 2 prior attempts + 1 in-flight (not 4)

    resolveFinish({ success: true });
    await Promise.all([p1, p2]);
    expect(mockAlert).toHaveBeenCalledWith(
      'Work Handed Over!',
      'Job transitioned to Awaiting Confirmation.'
    );
    expect(onJobUpdated).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
