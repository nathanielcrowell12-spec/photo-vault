# Helm Project Communication Setup

This guide explains how to set up communication between Photo Vault and Helm Project (Mission Control).

## Overview

The communication bridge allows:
- Photo Vault to send metrics to Helm Project
- Helm Project to monitor Photo Vault health
- Cross-project data synchronization
- Unified ecosystem monitoring

## Setup Instructions

### 1. Environment Variables

Add these variables to your Photo Vault `.env.local`:

```env
# Helm Project Communication
NEXT_PUBLIC_HELM_PROJECT_URL=http://localhost:3001
HELM_PROJECT_API_KEY=your_helm_project_api_key_here
```

Add these variables to your Helm Project `.env.local`:

```env
# Photo Vault Communication
PHOTOVAULT_API_URL=http://localhost:3000
PHOTOVAULT_API_KEY=your_photovault_api_key_here
```

### 2. Start Both Projects

1. Start Helm Project (Mission Control):
   ```bash
   cd "C:\Users\natha\.cursor\Helm Project"
   npm run dev
   ```
   This will run on http://localhost:3001

2. Start Photo Vault:
   ```bash
   cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"
   npm run dev
   ```
   This will run on http://localhost:3000

### 3. Test Communication

1. Open Photo Vault dashboard as admin
2. Look for the "Helm Project Status" card
3. Click "Sync" to test communication
4. Check Helm Project logs for incoming data

## API Endpoints

### Photo Vault → Helm Project

- **POST** `/api/helm/metrics` - Send Photo Vault metrics to Helm Project
- **GET** `/api/helm/metrics` - Get Photo Vault metrics for display

### Helm Project → Photo Vault

- **POST** `/api/ventures/photovault/metrics` - Receive Photo Vault metrics
- **GET** `/api/ventures/photovault/metrics` - Get stored Photo Vault data

## Data Flow

1. **Photo Vault** collects metrics (revenue, users, galleries, photos)
2. **Photo Vault** sends metrics to **Helm Project** via API
3. **Helm Project** stores metrics in database
4. **Helm Project** displays Photo Vault status in Mission Control dashboard
5. **Photo Vault** can fetch Helm Project status for display

## Troubleshooting

### Connection Issues

1. Check that both projects are running
2. Verify environment variables are set correctly
3. Check browser console for API errors
4. Verify CORS settings if needed

### Data Not Syncing

1. Check Helm Project API endpoints are accessible
2. Verify Photo Vault can reach Helm Project URL
3. Check database connections in both projects
4. Review API logs for errors

## Features

- **Automatic Sync**: Photo Vault automatically syncs with Helm Project every 5 minutes
- **Manual Sync**: Click "Sync" button for immediate synchronization
- **Health Monitoring**: Helm Project monitors Photo Vault system health
- **Metrics Tracking**: Revenue, users, galleries, and photo counts are tracked
- **Status Display**: Real-time status of both projects

## Security

- API keys should be kept secure
- Use HTTPS in production
- Implement rate limiting if needed
- Monitor API usage

## Next Steps

1. Set up production URLs
2. Configure SSL certificates
3. Set up monitoring and alerting
4. Implement backup and recovery
