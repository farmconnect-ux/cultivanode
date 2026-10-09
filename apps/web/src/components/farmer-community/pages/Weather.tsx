'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CloudRain, Sun, Wind, Droplets, Thermometer, Eye } from 'lucide-react';

export function Weather() {
  const currentWeather = {
    temp: 28,
    condition: 'Sunny with Warm Breezes',
    feelsLike: 31,
    wind: '14 km/h SW',
    humidity: '68%',
    visibility: '10 km',
    pressure: '1012 hPa'
  };

  const forecast = [
    { day: 'Mon', high: 31, low: 22, condition: '☀️', rain: 0 },
    { day: 'Tue', high: 30, low: 23, condition: '⛅', rain: 15 },
    { day: 'Wed', high: 27, low: 21, condition: '🌧️', rain: 80 },
    { day: 'Thu', high: 26, low: 20, condition: '🌧️', rain: 85 },
    { day: 'Fri', high: 29, low: 22, condition: '⛅', rain: 25 },
    { day: 'Sat', high: 32, low: 23, condition: '☀️', rain: 5 },
    { day: 'Sun', high: 33, low: 24, condition: '☀️', rain: 0 }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 font-serif">Weather & Microclimate Forecast</h1>
        <p className="text-sm text-gray-600">Local hyper-accurate agro-weather conditions, precipitation radar and field advice</p>
      </div>

      {/* Current Weather */}
      <Card className="p-6 border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="text-center lg:border-r lg:border-gray-100 pr-0 lg:pr-6">
            <Sun className="h-16 w-16 text-harvest-500 mx-auto mb-3 animate-pulse" />
            <h2 className="text-4xl font-bold text-gray-900 font-serif">{currentWeather.temp}°C</h2>
            <p className="text-base font-semibold text-gray-800 mt-1">{currentWeather.condition}</p>
            <p className="text-xs text-gray-500 mt-0.5">Feels like {currentWeather.feelsLike}°C · Oyo Micro-Region</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Wind, label: 'Wind Speed', value: currentWeather.wind },
              { icon: Droplets, label: 'Relative Humidity', value: currentWeather.humidity },
              { icon: Eye, label: 'Visibility', value: currentWeather.visibility },
              { icon: Thermometer, label: 'Atmospheric Pressure', value: currentWeather.pressure }
            ].map((item, index) => (
              <div key={index} className="text-center p-3 rounded-lg bg-cream/40 border border-gray-100">
                <item.icon className="h-5 w-5 text-leaf-700 mx-auto mb-1.5" />
                <p className="text-xs text-gray-600 font-medium">{item.label}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 7-Day Forecast */}
      <Card className="p-4 border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">7-Day Agricultural Forecast</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {forecast.map((day, index) => (
            <div key={index} className="text-center p-3 rounded-lg bg-leaf-50/50 border border-leaf-100/60">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{day.day}</div>
              <div className="text-2xl my-2">{day.condition}</div>
              <div className="text-sm font-bold text-leaf-900">{day.high}°</div>
              <div className="text-xs text-gray-500">{day.low}°</div>
              <div className="text-xs text-blue-600 font-medium mt-1">{day.rain}% rain</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Agricultural Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Growing Conditions Index</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-xs text-gray-700">Temperature Tolerance Range</span>
              <Badge className="bg-leaf-100 text-leaf-800">Optimal (24-32°C)</Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-xs text-gray-700">Foliar Humidity Level</span>
              <Badge className="bg-leaf-100 text-leaf-800">Good for Grains</Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-700">Canopy Wind Velocity</span>
              <Badge className="bg-harvest-100 text-harvest-800">Moderate (14 km/h)</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Agronomy & Spray Advisory</h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-start space-x-2 p-2 rounded bg-blue-50/60 border border-blue-100/50">
              <CloudRain className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <span className="text-gray-700"><strong>Heavy rain expected Wed-Thu (85% prob).</strong> Suspend automated drip irrigation for Ibadan Field A and open drain sluices.</span>
            </div>
            <div className="flex items-start space-x-2 p-2 rounded bg-leaf-50/60 border border-leaf-100/50">
              <Sun className="h-4 w-4 text-leaf-700 mt-0.5 shrink-0" />
              <span className="text-gray-700"><strong>Optimal spraying window on Friday:</strong> Low winds, zero dew index at 07:00. Best time for fall armyworm organic spray.</span>
            </div>
            <div className="flex items-start space-x-2 p-2 rounded bg-amber-50/60 border border-amber-100/50">
              <Wind className="h-4 w-4 text-harvest-600 mt-0.5 shrink-0" />
              <span className="text-gray-700"><strong>Drone Survey Advisory:</strong> Saturday morning calm winds (under 10 km/h) are ideal for multispectral NDVI flights.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
