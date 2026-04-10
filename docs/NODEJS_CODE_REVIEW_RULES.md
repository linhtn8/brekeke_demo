# Node.js Code Review Rules - Senior Level

## Purpose
Checklist cho Senior/Lead review code Node.js/TypeScript của team. Áp dụng cho middleware server và các service Node.js khác.

---

## 1. Error Handling

### Rules
- Mọi async operation phải có error handling
- WebSocket phải handle: `error`, `close`, `unexpected-response`
- Không để unhandled promise rejection
- Error messages không expose internal details

### Examples

```typescript
// ❌ BAD - No error handling
const upstream = new ws(`wss://${host}`);
upstream.send(data);

// ✅ GOOD - Proper error handling
const upstream = new ws(`wss://${host}`);

upstream.on('error', (err) => {
  logger.error('Upstream connection failed', { err, host });
  client.close(1011, 'Server error');
});

upstream.on('unexpected-response', (req, res) => {
  logger.warn('Upstream rejected connection', { statusCode: res.statusCode });
  client.close(1008, 'Service unavailable');
});
```

### Checklist
- [ ] Mọi async operation đều có try/catch hoặc `.catch()`
- [ ] WebSocket errors được handle (`error`, `close`, `unexpected-response`)
- [ ] Không để unhandled promise rejection
- [ ] Error messages không expose internal details (stack traces, paths, etc.)
- [ ] Graceful shutdown khi process nhận SIGTERM/SIGINT

---

## 2. Resource Management

### Rules
- Connection close → cleanup tất cả resources
- Có idle timeout để tránh dangling connections
- Check `readyState` trước khi send
- Không để memory leaks

### Examples

```typescript
// ❌ BAD - Memory leak, no cleanup
server.on('connection', (client) => {
  const upstream = new ws(upstreamUrl);
  client.on('message', (data) => upstream.send(data));
  upstream.on('message', (data) => client.send(data));
});

// ✅ GOOD - Proper cleanup on disconnect
server.on('connection', (client) => {
  const upstream = new ws(upstreamUrl);
  
  client.on('message', (data) => {
    if (upstream.readyState === ws.OPEN) {
      upstream.send(data);
    }
  });
  
  upstream.on('message', (data) => {
    if (client.readyState === ws.OPEN) {
      client.send(data);
    }
  });
  
  // Cleanup on disconnect
  client.on('close', () => upstream.terminate());
  upstream.on('close', () => client.close());
  
  // Timeout for idle connections
  const timeout = setTimeout(() => {
    client.close(1000, 'Idle timeout');
    upstream.close();
  }, 300_000); // 5 minutes
  
  client.on('close', () => clearTimeout(timeout));
});
```

### Checklist
- [ ] Connection close → cleanup tất cả resources
- [ ] Có idle timeout (max 5 phút)
- [ ] Check `readyState` trước khi send
- [ ] Không để dangling connections
- [ ] Event listeners được remove khi không cần

---

## 3. Security

### Rules
- Input validation (size, format, type)
- Rate limiting per connection
- Không log sensitive data (passwords, tokens)
- Environment variables cho config (không hardcode)
- CORS/origin validation nếu có HTTP endpoints

### Examples

```typescript
// ❌ BAD - No validation, no rate limit
client.on('message', (data) => {
  const packet = JSON.parse(data);
  upstream.send(JSON.stringify(packet));
});

// ✅ GOOD - Validate + sanitize + rate limit
const MAX_PACKET_SIZE = 64 * 1024; // 64KB
const RATE_LIMIT = 100; // messages per second
const messageCount = new Map();

client.on('message', (data) => {
  // Size check
  if (data.length > MAX_PACKET_SIZE) {
    logger.warn('Packet too large', { size: data.length });
    client.close(1009, 'Message too big');
    return;
  }
  
  // Parse validation
  let packet;
  try {
    packet = JSON.parse(data);
  } catch {
    logger.warn('Invalid JSON');
    client.close(1003, 'Invalid data');
    return;
  }
  
  // Rate limiting
  const count = messageCount.get(client) || 0;
  if (count > RATE_LIMIT) {
    client.close(1008, 'Rate limit exceeded');
    return;
  }
  messageCount.set(client, count + 1);
  
  // Tenant injection
  if (packet.tenant === '-') {
    packet.tenant = process.env.BREKEKE_TENANT;
  }
  
  upstream.send(JSON.stringify(packet));
});
```

### Checklist
- [ ] Input validation (size, format, type)
- [ ] Rate limiting per connection
- [ ] Không log sensitive data (passwords, tokens, PII)
- [ ] Environment variables cho config (không hardcode)
- [ ] CORS/origin validation nếu có HTTP endpoints
- [ ] Helmet middleware cho Express
- [ ] No SQL/NoSQL injection vulnerabilities

---

## 4. Logging & Observability

### Rules
- Structured logging (JSON format)
- Log levels đúng (info, warn, error, debug)
- KHÔNG log passwords, tokens, PII
- Correlation ID cho tracing
- Health check endpoint (`/health`)
- Metrics (connections count, message rate, errors)

### Examples

```typescript
// ❌ BAD - No logging or bad logging
console.log('User logged in', data); // logs password!

// ✅ GOOD - Structured logging
const logger = require('pino')();

client.on('message', (data) => {
  const packet = JSON.parse(data);
  
  logger.info({
    event: 'pal_message',
    action: packet.action,
    // NEVER log passwords or tokens
    username: packet.login_user,
    tenant: packet.tenant
  });
});
```

### Checklist
- [ ] Structured logging (JSON format) - dùng pino/winston
- [ ] Log levels đúng (info, warn, error, debug)
- [ ] KHÔNG log passwords, tokens, PII
- [ ] Correlation ID cho tracing
- [ ] Health check endpoint (`/health`)
- [ ] Metrics (connections count, message rate, errors)
- [ ] Không dùng `console.log` trong production code

---

## 5. Code Structure

### Recommended Structure
```
src/
├── index.ts              # Entry point
├── config/
│   └── env.ts            # Environment validation
├── proxy/
│   ├── pal-proxy.ts      # PAL WebSocket proxy
│   ├── sip-proxy.ts      # SIP WebSocket proxy
│   └── types.ts          # Proxy types
├── auth/
│   ├── tenant-resolver.ts
│   └── user-db.ts
├── branding/
│   └── config-loader.ts
├── middleware/
│   ├── rate-limiter.ts
│   └── logger.ts
└── utils/
    └── validators.ts
```

### Checklist
- [ ] Single Responsibility Principle
- [ ] Không có business logic trong index.ts
- [ ] Config tách biệt khỏi code
- [ ] Types/interfaces rõ ràng
- [ ] Max 300 lines/file
- [ ] No circular dependencies
- [ ] Named exports preferred over default exports

---

## 6. TypeScript Best Practices

### Rules
- NO `any` type
- Strict mode enabled (`"strict": true` in tsconfig)
- Interfaces cho tất cả data structures
- Return types explicit
- No `// @ts-ignore`

### Examples

```typescript
// ❌ BAD - Any types, no interfaces
function processMessage(data: any): any {
  return JSON.parse(data);
}

// ✅ GOOD - Strict types
interface PalLoginPacket {
  action: 'login';
  tenant: string;
  login_user: string;
  login_password: string;
  phone_idx: string;
}

interface PalResponse {
  status: 'success' | 'error';
  session_id?: string;
  error?: string;
}

function processMessage(data: string): PalLoginPacket {
  const packet = JSON.parse(data);
  return validatePalPacket(packet);
}
```

### Checklist
- [ ] NO `any` type
- [ ] Strict mode enabled (`"strict": true` in tsconfig)
- [ ] Interfaces cho tất cả data structures
- [ ] Return types explicit
- [ ] No `// @ts-ignore`
- [ ] Use `unknown` instead of `any` when type is truly unknown
- [ ] Use `as const` for literal types
- [ ] Union types cho enum-like values

---

## 7. Environment & Config

### Rules
- Validate env vars at startup
- Fail fast nếu thiếu required config
- `.env.example` có trong repo
- KHÔNG commit `.env` file

### Examples

```typescript
// ❌ BAD - No validation, defaults everywhere
const port = process.env.PORT || 3000;
const host = process.env.BREKEKE_HOST; // could be undefined!

// ✅ GOOD - Validation at startup
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(443),
  BREKEKE_HOST: z.string().url(),
  BREKEKE_PORT: z.coerce.number().min(1).max(65535),
  BREKEKE_TENANT: z.string().min(1),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const env = envSchema.parse(process.env);
// Fails fast if required env vars missing
```

### Checklist
- [ ] Validate env vars at startup (dùng zod/joi)
- [ ] Fail fast nếu thiếu required config
- [ ] `.env.example` có trong repo
- [ ] KHÔNG commit `.env` file
- [ ] `.env` trong `.gitignore`
- [ ] Config typed (không dùng `process.env` trực tiếp)

---

## 8. Performance

### Rules
- No synchronous I/O trong request path
- Cache khi có thể (config, DNS, etc.)
- Connection pooling nếu có database
- Không blocking event loop

### Examples

```typescript
// ❌ BAD - Blocking operations
client.on('message', (data) => {
  const config = fs.readFileSync(`config/${tenant}.json`); // BLOCKING!
  // ...
});

// ✅ GOOD - Cache + async
const configCache = new Map<string, TenantConfig>();

async function getTenantConfig(tenantId: string): Promise<TenantConfig> {
  if (configCache.has(tenantId)) {
    return configCache.get(tenantId)!;
  }
  
  const config = await fs.promises.readFile(`config/${tenantId}.json`);
  const parsed = JSON.parse(config);
  configCache.set(tenantId, parsed);
  return parsed;
}
```

### Checklist
- [ ] No synchronous I/O trong request path (`fs.readFileSync`, etc.)
- [ ] Cache khi có thể (config, DNS, etc.)
- [ ] Connection pooling nếu có database
- [ ] Không blocking event loop (no heavy sync operations)
- [ ] Use streams cho large data
- [ ] Pagination cho large queries

---

## 9. Testing

### Rules
- Unit tests cho business logic
- Integration tests cho proxy
- Test edge cases (invalid data, disconnects)
- Coverage > 80%
- Mock external services

### Examples

```typescript
describe('PAL Proxy', () => {
  describe('tenant injection', () => {
    it('should inject tenant when tenant is "-"', () => {
      const packet = { tenant: '-', login_user: 'user1' };
      const result = injectTenant(packet, 'bap-tenant');
      expect(result.tenant).toBe('bap-tenant');
    });
    
    it('should NOT inject when tenant already set', () => {
      const packet = { tenant: 'existing-tenant', login_user: 'user1' };
      const result = injectTenant(packet, 'bap-tenant');
      expect(result.tenant).toBe('existing-tenant');
    });
  });
  
  describe('error handling', () => {
    it('should close client on upstream error', async () => {
      // Test implementation
    });
    
    it('should handle invalid JSON gracefully', async () => {
      // Test implementation
    });
  });
});
```

### Checklist
- [ ] Unit tests cho business logic
- [ ] Integration tests cho proxy
- [ ] Test edge cases (invalid data, disconnects, timeouts)
- [ ] Coverage > 80%
- [ ] Mock external services
- [ ] Test file naming: `*.test.ts` hoặc `*.spec.ts`
- [ ] AAA pattern (Arrange, Act, Assert)

---

## 10. Docker

### Rules
- Multi-stage build
- Alpine base image
- Non-root user
- `.dockerignore` có `node_modules`
- Health check in Dockerfile

### Examples

```dockerfile
# ❌ BAD - Large image, no multi-stage
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "dist/index.js"]

# ✅ GOOD - Multi-stage, minimal image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 443
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:443/health || exit 1
CMD ["node", "dist/index.js"]
# Image: ~150MB instead of ~1GB
```

### Checklist
- [ ] Multi-stage build
- [ ] Alpine base image
- [ ] Non-root user (`USER node`)
- [ ] `.dockerignore` có `node_modules`, `.env`, `.git`
- [ ] Health check in Dockerfile
- [ ] Pin Node.js version (không dùng `latest`)
- [ ] Production deps only (`npm ci --omit=dev`)

---

## 11. Git & PR Best Practices

### Checklist
- [ ] Commit messages theo convention (feat:, fix:, refactor:, etc.)
- [ ] PR description rõ ràng, có screenshots nếu UI change
- [ ] No console.log còn sót
- [ ] No commented-out code
- [ ] Dependencies updated (không dùng deprecated packages)
- [ ] TypeScript compiles without errors
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm test`)

---

## Quick Review Checklist

| Category | Must Check |
|----------|-----------|
| **Security** | Input validation, no secrets in code, rate limiting, CORS |
| **Error Handling** | All async caught, WebSocket errors handled, graceful shutdown |
| **Resources** | Connections cleaned up, timeouts set, no memory leaks |
| **Logging** | Structured, no sensitive data, correct levels, no console.log |
| **Types** | No `any`, strict mode, interfaces defined, explicit returns |
| **Config** | Env validated, fail fast, .env.example present |
| **Performance** | No blocking I/O, caching where needed, streams for large data |
| **Tests** | Core logic tested, edge cases covered, coverage > 80% |
| **Docker** | Multi-stage, alpine, non-root, healthcheck, .dockerignore |
| **Git** | Clean commits, PR description, linting passes, tests pass |

---

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| **🔴 BLOCKER** | Security vulnerability, data leak, crash | Must fix before merge |
| **🟠 MAJOR** | Missing error handling, memory leak, performance issue | Should fix before merge |
| **🟡 MINOR** | Code style, missing types, suboptimal pattern | Can fix in follow-up |
| **🟢 INFO** | Suggestion, nice-to-have | Optional |

---

## Review Process

1. **Automated checks** (CI):
   - TypeScript compilation
   - Linting
   - Tests
   - Security scan (npm audit)

2. **Manual review**:
   - Read diff thoroughly
   - Check against this checklist
   - Test locally if complex
   - Approve or request changes

3. **Merge criteria**:
   - All CI checks pass
   - No BLOCKER or MAJOR issues
   - At least 1 senior approval
   - PR description complete

---

**Version:** 1.0  
**Last Updated:** April 7, 2026  
**Maintained by:** Senior Dev Team
