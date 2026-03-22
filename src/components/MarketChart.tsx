"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

export default function MarketChart({ probability }: { probability: number }) {
  // Generamos un historial simulado (random walk) que termine exactamente en la probabilidad actual
  const data = useMemo(() => {
    const history = [];
    const days = 90; // 3 meses de historial simulado
    let currentYes = 50; // Asumimos que la apuesta empezó 50/50
    
    // Configuramos la semilla para que el gráfico fluya hacia la probabilidad destino
    const target = probability;
    const diffPerDay = (target - currentYes) / days;

    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      
      // Añadimos un poco de ruido aleatorio (volatilidad) pero empujando hacia el target
      const noise = (Math.random() - 0.5) * 4; 
      
      if (i === 0) {
        currentYes = target;
      } else {
        currentYes = currentYes + diffPerDay + noise;
      }
      
      // Limitamos los valores entre 1 y 99
      currentYes = Math.max(1, Math.min(99, currentYes));

      history.push({
        date: d.toLocaleDateString("es-CR", { month: "short", day: "numeric" }),
        yes: parseFloat(currentYes.toFixed(1)),
        no: parseFloat((100 - currentYes).toFixed(1))
      });
    }
    
    return history;
  }, [probability]);

  return (
    <div className="w-full h-80 bg-[#111113] p-4 rounded-xl ring-1 ring-zinc-800 relative select-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#71717a", fontSize: 12 }} 
            minTickGap={30}
            dy={10}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#71717a", fontSize: 12 }} 
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            dx={-10}
          />
          
          <Tooltip 
            contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", color: "#e4e4e7" }}
            itemStyle={{ fontWeight: "bold" }}
            formatter={(value: any, name: any) => [`${value}%`, name]}
            labelStyle={{ color: "#a1a1aa", marginBottom: "4px" }}
          />

          {/* Línea "SÍ" (Azul brillante) */}
          <Line 
            type="stepAfter" 
            dataKey="yes" 
            name="SÍ" 
            stroke="#22c55e" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 6, fill: "#22c55e", stroke: "#111113", strokeWidth: 2 }}
          />
          
          {/* Línea "NO" (Naranja) */}
          <Line 
            type="stepAfter" 
            dataKey="no" 
            name="NO" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 6, fill: "#ef4444", stroke: "#111113", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
