#!/usr/bin/env python3
"""Fix type-only imports in ZCode's rpc package for scriptc's module linker.

scriptc keeps a runtime binding check for every named import that is not
marked `type`; `IDisposable` is a pure TS interface (no runtime object), so
the library init failed with SC4013:

    Uncaught SyntaxError: The requested module './foundation.js'
    does not provide an export named 'IDisposable'

The fix adds the inline `type` modifier (a compile-time-only annotation —
zero runtime semantic change; sibling files like channelClient.ts and
channelServer.ts already use this style). Applies to the ZCode checkout
(argument = ZCode repo root). Asserts every anchor fires exactly once.
"""
import os
import sys

root = sys.argv[1] if len(sys.argv) > 1 else 'ZCode'

FILES = {
    'packages/rpc/src/ipc.ts': [
        ('  Emitter,\n  IDisposable,\n  DisposableStore,',
         '  Emitter,\n  type IDisposable,\n  DisposableStore,'),
        ('import { IMessagePassingProtocol } from "./protocol.js";',
         'import { type IMessagePassingProtocol } from "./protocol.js";'),
        ('  IChannel,\n  IServerChannel,\n  IChannelServer,\n  IChannelClient,',
         '  type IChannel,\n  type IServerChannel,\n  type IChannelServer,\n  type IChannelClient,'),
    ],
    'packages/rpc/src/protocol.ts': [
        ('import { Event, Emitter, IDisposable, DisposableStore } from "./foundation.js";',
         'import { Event, Emitter, type IDisposable, DisposableStore } from "./foundation.js";'),
    ],
    'packages/rpc/src/proxy-channel.ts': [
        ('import { Event, Emitter, IDisposable, DisposableStore } from "./foundation.js";',
         'import { Event, Emitter, type IDisposable, DisposableStore } from "./foundation.js";'),
        ('import { IChannel, IServerChannel } from "./channels.js";',
         'import { type IChannel, type IServerChannel } from "./channels.js";'),
    ],
    'packages/rpc/src/remote.ts': [
        ('import { Emitter, IDisposable, toDisposable } from "./foundation.js";',
         'import { Emitter, type IDisposable, toDisposable } from "./foundation.js";'),
        ('import { ISocket } from "./protocol.js";',
         'import { type ISocket } from "./protocol.js";'),
    ],
}

total = 0
for rel, pairs in sorted(FILES.items()):
    p = os.path.join(root, rel)
    src = open(p, encoding='utf-8').read()
    for old, new in pairs:
        cnt = src.count(old)
        assert cnt == 1, (rel, cnt, old[:60])
        src = src.replace(old, new, 1)
        total += 1
    open(p, 'w', encoding='utf-8').write(src)
    print('fixed:', rel, '(%d edits)' % len(pairs))
print('total edits:', total)