# BUGFIX: Dockerfile Build Error - Application DLL Not Found

**Date:** October 20, 2025  
**Status:** ✅ FIXED  
**Priority:** Critical

## Problem

When running the `graphicrequest-api-dev` container, it immediately exited with error:
```
The application 'GraphicRequestSystem.API.dll' does not exist
```

## Root Cause

**Incorrect Docker Build Context Paths**

The Dockerfiles were written assuming they would be built from the root directory (`GraphicRequestSystem/`) but with paths that assumed the build context was already inside the subdirectory.

### Issues Found:

1. **API Dockerfile** (`GraphicRequestSystem.API/Dockerfile`):
   - Was trying to copy: `COPY ["GraphicRequestSystem.API/GraphicRequestSystem.API.csproj", "GraphicRequestSystem.API/"]`
   - But since the Dockerfile is already in `GraphicRequestSystem.API/`, this path was incorrect
   
2. **Client Dockerfile** (`graphic-request-client/Dockerfile`):
   - Same issue: `COPY graphic-request-client/package*.json ./`
   - Should be: `COPY package*.json ./`

3. **Docker Compose Files**:
   - Build context was set to `.` (root) but dockerfile path was to subdirectory
   - This mismatch caused path resolution issues

## Solution

### 1. Fixed API Dockerfile

**Before:**
```dockerfile
# Copy csproj and restore dependencies
COPY ["GraphicRequestSystem.API/GraphicRequestSystem.API.csproj", "GraphicRequestSystem.API/"]
RUN dotnet restore "GraphicRequestSystem.API/GraphicRequestSystem.API.csproj"

# Copy everything else and build
COPY GraphicRequestSystem.API/ GraphicRequestSystem.API/
WORKDIR "/src/GraphicRequestSystem.API"
RUN dotnet build "GraphicRequestSystem.API.csproj" -c Release -o /app/build
```

**After:**
```dockerfile
# Copy csproj and restore dependencies
COPY ["GraphicRequestSystem.API.csproj", "./"]
RUN dotnet restore "GraphicRequestSystem.API.csproj"

# Copy everything else and build
COPY . .
RUN dotnet build "GraphicRequestSystem.API.csproj" -c Release -o /app/build
```

### 2. Fixed Client Dockerfile

**Before:**
```dockerfile
COPY graphic-request-client/package*.json ./
COPY graphic-request-client/ ./
COPY graphic-request-client/nginx.conf /etc/nginx/conf.d/default.conf
```

**After:**
```dockerfile
COPY package*.json ./
COPY . ./
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### 3. Fixed Docker Compose Build Contexts

Updated all compose files to use the subdirectory as context:

**docker-compose.yml:**
```yaml
api:
  build:
    context: ./GraphicRequestSystem.API  # Changed from '.'
    dockerfile: Dockerfile                # Changed from 'GraphicRequestSystem.API/Dockerfile'

client:
  build:
    context: ./graphic-request-client    # Changed from '.'
    dockerfile: Dockerfile                # Changed from 'graphic-request-client/Dockerfile'
```

**docker-compose.dev.yml:** Same changes  
**docker-compose.prod.yml:** Same changes

## Files Modified

1. ✅ `GraphicRequestSystem.API/Dockerfile`
2. ✅ `graphic-request-client/Dockerfile`
3. ✅ `docker-compose.yml`
4. ✅ `docker-compose.dev.yml`
5. ✅ `docker-compose.prod.yml`

## Verification

### Build Test:
```bash
docker-compose build api
```
**Result:** ✅ Build completed successfully (142.3s)

### Runtime Test:
```bash
docker run --rm graphicrequestsystem-api ls -la /app
```
**Result:** ✅ Application starts and attempts to connect to Hangfire (DLL found and executed)

### Files Present in Container:
```
/app/GraphicRequestSystem.API.dll          ✅ Present
/app/appsettings.json                      ✅ Present
/app/wwwroot/uploads/                      ✅ Directory created
```

## Technical Details

### Docker Multi-Stage Build Context

When using multi-stage builds with Docker Compose, the `context` parameter defines the root directory for all COPY commands in the Dockerfile. 

**Key Rules:**
- All COPY paths in Dockerfile are relative to the `context` directory
- The Dockerfile location is specified separately via `dockerfile` parameter
- Changing context requires updating all COPY commands to match new relative paths

### Why This Matters

The original configuration would work if building with:
```bash
cd GraphicRequestSystem
docker build -f GraphicRequestSystem.API/Dockerfile .
```

But fails with docker-compose because the context resolution is different.

## Lessons Learned

1. **Keep Dockerfiles in Project Root**: Each microservice Dockerfile should assume its own directory is the build context
2. **Match Context to Project Structure**: Set `context` to the project directory, not the monorepo root
3. **Use Relative Paths**: All COPY commands should use paths relative to the Dockerfile's project
4. **Test Both Ways**: Verify builds work with both `docker build` and `docker-compose build`

## Related Issues

- Client build fails with TypeScript errors (separate issue - unused variables)
- SQL Server health check needs timeout adjustment (separate issue)
- Environment variable warnings about `$o` variable (cosmetic, non-blocking)

## Next Steps

1. ✅ API Dockerfile - FIXED
2. ✅ Client Dockerfile - FIXED
3. ⏳ Fix TypeScript linting errors in client
4. ⏳ Verify full stack deployment with database

## Testing Checklist

- [x] API builds successfully
- [x] API container finds GraphicRequestSystem.API.dll
- [x] API starts application and loads Hangfire
- [x] Build context uses correct paths
- [x] All compose files updated consistently
- [ ] Full stack deployment test (blocked by client TypeScript errors)
- [ ] Database migrations run automatically
- [ ] File uploads persist in volume

## References

- Docker Build Context: https://docs.docker.com/engine/reference/commandline/build/#build-context
- Docker Compose Build: https://docs.docker.com/compose/compose-file/build/
- Multi-stage Builds: https://docs.docker.com/build/building/multi-stage/
