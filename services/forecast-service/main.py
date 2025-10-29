"""
Blipee Prophet Forecasting Service

FastAPI service providing state-of-the-art time series forecasting
using Facebook Prophet. Runs alongside Node.js agent worker in the
same Railway container.

Port: 8001 (internal only - localhost communication)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from prophet import Prophet
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Blipee Prophet Forecasting Service",
    description="State-of-the-art time series forecasting for sustainability metrics",
    version="1.0.0"
)

# CORS for internal communication with Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Internal only, safe
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class HistoricalDataPoint(BaseModel):
    """Single historical data point"""
    date: str  # ISO format: "2022-01-01"
    value: float  # Metric value


class ForecastRequest(BaseModel):
    """Request model for forecast endpoint"""
    domain: str  # "energy", "water", "waste", "emissions"
    organizationId: str
    historicalData: List[HistoricalDataPoint]
    monthsToForecast: int


class ForecastResponse(BaseModel):
    """Response model with forecast results"""
    forecasted: List[float]
    confidence: Dict[str, List[float]]
    method: str
    metadata: Dict


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Blipee Prophet Forecasting",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint for Prophet service"""
    return {
        "status": "healthy",
        "model": "prophet",
        "version": "1.1.5"
    }


@app.post("/predict", response_model=ForecastResponse)
async def predict(request: ForecastRequest):
    """
    Generate forecast using Facebook Prophet
    
    Prophet is a production-ready forecasting tool developed by Meta (Facebook).
    Used by companies like Airbnb, Uber, and thousands of others for 
    production time series forecasting.
    
    Features:
    - Automatic seasonality detection
    - Trend changepoint detection
    - Holiday effects (if configured)
    - Uncertainty intervals
    - Robust to missing data and outliers
    """
    try:
        logger.info(f"Forecast request: {request.domain} for org {request.organizationId}")
        
        # 1. Validate input
        if len(request.historicalData) < 12:
            raise HTTPException(
                status_code=400,
                detail="Need at least 12 months of historical data for reliable forecasting"
            )
        
        # 2. Transform to Prophet format (requires 'ds' and 'y' columns)
        df = pd.DataFrame({
            'ds': pd.to_datetime([d.date for d in request.historicalData]),
            'y': [d.value for d in request.historicalData]
        })
        
        logger.info(f"Training with {len(df)} data points, forecasting {request.monthsToForecast} months")
        
        # 3. Initialize Prophet with optimized parameters for sustainability data
        model = Prophet(
            yearly_seasonality=True,       # Capture annual patterns (winter/summer)
            weekly_seasonality=False,      # Not relevant for monthly data
            daily_seasonality=False,       # Not relevant for monthly data
            changepoint_prior_scale=0.05,  # Conservative (prevents overfitting)
            seasonality_prior_scale=10,    # Strong seasonality emphasis
            interval_width=0.95,           # 95% confidence intervals
            growth='linear',               # Linear trend (can switch to 'logistic' if needed)
            seasonality_mode='multiplicative'  # Better for data with seasonal variance
        )
        
        # 4. Fit the model to historical data
        with pd.option_context('mode.chained_assignment', None):
            model.fit(df)
        
        # 5. Create future dataframe for forecasting
        future = model.make_future_dataframe(
            periods=request.monthsToForecast,
            freq='MS'  # Month Start frequency
        )
        
        # 6. Generate forecast
        forecast = model.predict(future)
        
        # 7. Extract only future predictions (not historical fit)
        forecasted_values = forecast.tail(request.monthsToForecast)
        
        # 8. Build response with forecast and confidence intervals
        response = ForecastResponse(
            forecasted=forecasted_values['yhat'].tolist(),
            confidence={
                'lower': forecasted_values['yhat_lower'].tolist(),
                'upper': forecasted_values['yhat_upper'].tolist()
            },
            method='prophet',
            metadata={
                'trend': float(forecast['trend'].iloc[-1]),
                'yearly': float(forecast['yearly'].iloc[-1]) if 'yearly' in forecast else 0.0,
                'historical_mean': float(df['y'].mean()),
                'historical_std': float(df['y'].std()),
                'data_points': len(df),
                'forecast_horizon': request.monthsToForecast,
                'domain': request.domain,
                'organization_id': request.organizationId,
                'generated_at': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Forecast generated successfully: {len(response.forecasted)} months")
        
        return response
        
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forecasting failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
