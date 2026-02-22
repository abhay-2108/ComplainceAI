import logging
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config.settings import settings
from backend.api.routes import dashboard, violations, policies, agents, risk, rag, auth, transactions, reports, audit, predictions

from backend.core.startup import start_app_handler, stop_app_handler

# Setup logging
logger = logging.getLogger(__name__)

app_loop = None

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        docs_url="/docs",
    )

    # Register Lifespan Handlers
    @app.on_event("startup")
    async def startup_event():
        global app_loop
        app_loop = asyncio.get_running_loop()
        await start_app_handler(app)

    @app.on_event("shutdown")
    async def shutdown_event():
        await stop_app_handler(app)

    # CORS Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Adjust for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include Routes
    app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
    app.include_router(violations.router, prefix="/api/violations", tags=["Violations"])
    app.include_router(policies.router, prefix="/api/policies", tags=["Policies"])
    app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
    app.include_router(risk.router, prefix="/api/risk", tags=["Risk ML"])
    app.include_router(rag.router, prefix="/api/rag", tags=["RAG Test"])
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
    app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
    app.include_router(audit.router, prefix="/api/audit", tags=["Audit Logs"])
    app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy", "project": settings.PROJECT_NAME, "version": settings.VERSION}

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
