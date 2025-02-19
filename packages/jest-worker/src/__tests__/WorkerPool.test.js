/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import WorkerPool from '../WorkerPool';
import ChildProcessWorker from '../workers/ChildProcessWorker';
import NodeThreadWorker from '../workers/NodeThreadsWorker';

jest.mock('../workers/ChildProcessWorker', () => {
  const fakeClass = jest.fn(() => ({
    getStderr: jest.fn(),
    getStdout: jest.fn(),
    send: jest.fn(),
  }));

  return {
    __esModule: true,
    default: fakeClass,
  };
});

jest.mock('../workers/NodeThreadsWorker', () => {
  const fakeClass = jest.fn(() => ({
    getStderr: jest.fn(),
    getStdout: jest.fn(),
    send: jest.fn(),
  }));

  return {
    __esModule: true,
    default: fakeClass,
  };
});

describe('WorkerPool', () => {
  beforeEach(() => {
    ChildProcessWorker.mockClear();
    NodeThreadWorker.mockClear();
  });

  it('should create a ChildProcessWorker and send to it', () => {
    jest.mock('worker_threads', () => {
      throw Error('Undefined');
    });
    const workerPool = new WorkerPool('/path', {
      forkOptions: {},
      maxRetries: 1,
      numWorkers: 1,
      workerId: 0,
      workerPath: '/path',
    });

    const onStart = () => {};
    const onEnd = () => {};
    workerPool.send(0, {foo: 'bar'}, onStart, onEnd);

    expect(ChildProcessWorker).toHaveBeenCalledWith({
      forkOptions: {},
      maxRetries: 1,
      workerId: 0,
      workerPath: '/path',
    });
    expect(NodeThreadWorker).not.toHaveBeenCalled();
    expect(workerPool._workers[0].send).toHaveBeenCalledWith(
      {foo: 'bar'},
      onStart,
      onEnd,
      undefined,
    );
  });

  it('should create a NodeThreadWorker and send to it', () => {
    jest.mock('worker_threads', () => 'Defined');
    const workerPool = new WorkerPool('/path', {
      enableWorkerThreads: true,
      forkOptions: {},
      maxRetries: 1,
      numWorkers: 1,
      workerId: 0,
      workerPath: '/path',
    });

    const onStart = () => {};
    const onEnd = () => {};
    workerPool.send(0, {foo: 'bar'}, onStart, onEnd);

    expect(NodeThreadWorker).toHaveBeenCalledWith({
      forkOptions: {},
      maxRetries: 1,
      workerId: 0,
      workerPath: '/path',
    });
    expect(ChildProcessWorker).not.toHaveBeenCalled();
    expect(workerPool._workers[0].send).toHaveBeenCalledWith(
      {foo: 'bar'},
      onStart,
      onEnd,
      undefined,
    );
  });

  it('should avoid NodeThreadWorker if not passed enableWorkerThreads', () => {
    jest.mock('worker_threads', () => 'Defined');
    const workerPool = new WorkerPool('/path', {
      forkOptions: {},
      maxRetries: 1,
      numWorkers: 1,
      workerId: 0,
      workerPath: '/path',
    });

    const onStart = () => {};
    const onEnd = () => {};
    workerPool.send(0, {foo: 'bar'}, onStart, onEnd);

    expect(ChildProcessWorker).toHaveBeenCalledWith({
      forkOptions: {},
      maxRetries: 1,
      workerId: 0,
      workerPath: '/path',
    });
    expect(NodeThreadWorker).not.toHaveBeenCalled();
    expect(workerPool._workers[0].send).toHaveBeenCalledWith(
      {foo: 'bar'},
      onStart,
      onEnd,
      undefined,
    );
  });
});
