// Health check endpoint for Railway/Docker
export default defineEventHandler(async (event) => {
  try {
    // Import mongoose to check database connection
    const mongoose = await import('mongoose')
    
    const dbState = mongoose.default.connection.readyState
    const dbStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }
    
    const dbStatus = dbStatusMap[dbState] || 'unknown'
    const isHealthy = dbState === 1

    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: {
          status: dbStatus,
          type: 'MongoDB',
        },
        server: {
          status: 'running',
          port: process.env.PORT || 3000,
        },
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    }

    if (!isHealthy) {
      setResponseStatus(event, 503)
    }

    return healthData
  }
  catch (error: any) {
    setResponseStatus(event, 503)
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message || 'Unknown error',
    }
  }
})
