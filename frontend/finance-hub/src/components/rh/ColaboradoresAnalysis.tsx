import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis,
} from "recharts";
import type { RHData } from "@/hooks/useRHData";
import { Users, UserCheck, UserPlus, Brain } from "lucide-react";

interface ColaboradoresAnalysisProps {
  data: RHData;
}

// ─── Color Palette ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  ativos: "hsl(var(--primary))",
  afastados: "#f43f5e",
  ferias: "#3b82f6",
};

const DISC_COLORS: Record<string, string> = {
  executor: "#f43f5e",
  comunicador: "#f59e0b",
  planejador: "hsl(var(--primary))",
  analista: "#3b82f6",
};

const DISC_LABELS: Record<string, string> = {
  executor: "Executor (D)",
  comunicador: "Comunicador (I)",
  planejador: "Planejador (S)",
  analista: "Analista (C)",
};

// ─── KPI Cards ─────────────────────────────────────────────────────────────────
function KPICards({ data }: { data: RHData }) {
  const { kpis } = data;

  const cards = [
    {
      label: "TOTAL COLABORADORES",
      value: kpis?.total_colaboradores ?? 0,
      icon: Users,
      isHighlight: true,
      suffix: "",
    },
    {
      label: "ATIVOS",
      value: kpis?.total_ativos ?? 0,
      icon: UserCheck,
      isHighlight: false,
      suffix: "",
      sub: kpis ? `${Number(kpis.perc_ativos).toFixed(1)}% do total` : "—",
    },
    {
      label: "ADMISSÕES NO MÊS",
      value: kpis?.admissoes_mes_atual ?? 0,
      icon: UserPlus,
      isHighlight: false,
      suffix: "",
      sub: "novas contratações",
    },
    {
      label: "PROFILER APLICADO",
      value: kpis ? Number(kpis.perc_profiler_aplicado).toFixed(1) : "—",
      icon: Brain,
      isHighlight: false,
      suffix: "%",
      sub: "colaboradores mapeados",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, isHighlight, suffix, sub }) => (
        <Card
          key={label}
          className={`relative overflow-hidden border-0 rounded-xl transition-shadow hover:shadow-md ${
            isHighlight
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
          }`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <p className={`text-[10px] font-bold tracking-[0.1em] ${
                isHighlight ? "text-primary-foreground/70" : "text-primary"
              }`}>
                {label}
              </p>
              <div className={`p-1.5 rounded-lg ${
                isHighlight ? "bg-primary-foreground/10" : "bg-primary/10"
              }`}>
                <Icon className={`h-3.5 w-3.5 ${
                  isHighlight ? "text-primary-foreground" : "text-primary"
                }`} />
              </div>
            </div>
            <p className={`text-2xl font-extrabold tabular-nums tracking-tight ${
              isHighlight ? "text-primary-foreground" : "text-foreground"
            }`}>
              {value}{suffix}
            </p>
            {sub && (
              <p className={`text-[10px] mt-0.5 ${
                isHighlight ? "text-primary-foreground/60" : "text-muted-foreground"
              }`}>
                {sub}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Headcount por Departamento ─────────────────────────────────────────────────
function HeadcountChart({ data }: { data: RHData }) {
  const chartData = data.headcountDept.map((d) => ({
    name: d.departamento_nome.length > 20
      ? d.departamento_nome.slice(0, 20) + "…"
      : d.departamento_nome,
    Ativos: d.total_ativos,
    Afastados: d.total_afastados,
    Férias: d.total_ferias,
  }));

  if (chartData.length === 0) return null;

  return (
    <Card className="border-0 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-foreground">Headcount por Departamento</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              cursor={{ fill: "hsl(var(--accent))" }}
            />
            <Bar dataKey="Ativos" fill={STATUS_COLORS.ativos} radius={[0, 4, 4, 0]} stackId="a" />
            <Bar dataKey="Afastados" fill={STATUS_COLORS.afastados} radius={[0, 0, 0, 0]} stackId="a" />
            <Bar dataKey="Férias" fill={STATUS_COLORS.ferias} radius={[0, 4, 4, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Distribuição de Status ─────────────────────────────────────────────────────
function StatusDistribuicaoChart({ data }: { data: RHData }) {
  const { kpis } = data;
  if (!kpis) return null;

  const pieData = [
    { name: "Ativos", value: kpis.total_ativos, color: STATUS_COLORS.ativos },
    { name: "Afastados", value: kpis.total_afastados, color: STATUS_COLORS.afastados },
    { name: "Férias", value: kpis.total_ferias, color: STATUS_COLORS.ferias },
  ].filter((d) => d.value > 0);

  const RADIAN = Math.PI / 180;
  const renderLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent,
  }: {
    cx: number; cy: number; midAngle: number;
    innerRadius: number; outerRadius: number; percent: number;
  }) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="border-0 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-foreground">Distribuição de Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="45%"
              outerRadius={100}
              innerRadius={50}
              dataKey="value"
              labelLine={false}
              label={renderLabel}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Distribuição DISC ──────────────────────────────────────────────────────────
function DiscDistribuicaoChart({ data }: { data: RHData }) {
  const aggregated = useMemo(() => {
    const map: Record<string, number> = {};
    data.distribuicaoDisc.forEach((d) => {
      if (!map[d.perfil_dominante]) map[d.perfil_dominante] = 0;
      map[d.perfil_dominante] += d.quantidade;
    });
    return Object.entries(map)
      .map(([perfil, quantidade]) => ({
        perfil,
        label: DISC_LABELS[perfil] ?? perfil,
        quantidade,
        fill: DISC_COLORS[perfil] ?? "hsl(var(--muted))",
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [data.distribuicaoDisc]);

  if (aggregated.length === 0) return null;

  return (
    <Card className="border-0 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-foreground">Distribuição de Perfis DISC</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={aggregated} margin={{ top: 4, right: 16, left: 0, bottom: 4 }} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              cursor={{ fill: "hsl(var(--accent))" }}
              formatter={(val: number) => [val, "Colaboradores"]}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
              {aggregated.map((entry, index) => (
                <Cell key={`disc-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {aggregated.map(({ label, fill, quantidade }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <span className="text-[11px] font-bold text-foreground">{quantidade}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Mapa de Talentos (Scatter) ─────────────────────────────────────────────────
function MapaTalentosChart({ data }: { data: RHData }) {
  const byPerfil = useMemo(() => {
    const groups: Record<string, { x: number; y: number; z: number; nome: string; cargo: string }[]> = {};
    data.mapaTalentos.forEach((colab) => {
      const key = colab.perfil_dominante;
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        x: Number(colab.nivel_energia),
        y: Number(colab.indice_satisfacao),
        z: 1,
        nome: colab.colaborador_nome,
        cargo: colab.cargo_nome,
      });
    });
    return groups;
  }, [data.mapaTalentos]);

  if (data.mapaTalentos.length === 0) return null;

  return (
    <Card className="border-0 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-foreground">Mapa de Talentos</CardTitle>
        <p className="text-[11px] text-muted-foreground">Nível de Energia × Índice de Satisfação por perfil DISC</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="x"
              name="Energia"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Nível de Energia", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Satisfação"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Satisfação", angle: -90, position: "insideLeft", offset: 8, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <ZAxis range={[50, 50]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value, name) => [value, name === "x" ? "Energia" : name === "y" ? "Satisfação" : name]}
            />
            {Object.entries(byPerfil).map(([perfil, points]) => (
              <Scatter
                key={perfil}
                name={DISC_LABELS[perfil] ?? perfil}
                data={points}
                fill={DISC_COLORS[perfil] ?? "hsl(var(--muted))"}
                fillOpacity={0.75}
              />
            ))}
            <Legend
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Ranking por Afastamento / Férias ──────────────────────────────────────────
function AbsenciaResumoCard({ data }: { data: RHData }) {
  const { kpis } = data;
  if (!kpis) return null;

  const items = [
    { label: "Colaboradores Ativos", value: kpis.total_ativos, color: STATUS_COLORS.ativos },
    { label: "Em Férias", value: kpis.total_ferias, color: STATUS_COLORS.ferias },
    { label: "Afastados", value: kpis.total_afastados, color: STATUS_COLORS.afastados },
  ];

  const total = kpis.total_colaboradores || 1;

  return (
    <Card className="border-0 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-foreground">Resumo da Força de Trabalho</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        {items.map(({ label, value, color }) => {
          const pct = ((value / total) * 100).toFixed(1);
          return (
            <div key={label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-bold text-foreground">{value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}

        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-bold">Total Geral</span>
            <span className="text-lg font-extrabold text-foreground">{kpis.total_colaboradores}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[55vh] text-center space-y-4">
      <div className="bg-primary/10 p-5 rounded-full">
        <Users className="h-12 w-12 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Nenhum dado disponível</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
          Execute o pipeline ETL do Sólides para carregar os dados de colaboradores.
        </p>
      </div>
      <div className="bg-muted/60 rounded-lg px-5 py-3 text-left max-w-sm">
        <p className="text-xs font-mono text-muted-foreground">
          cd etl/solides-people-pipeline<br />
          python pipeline.py --layer all
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export function ColaboradoresAnalysis({ data }: ColaboradoresAnalysisProps) {
  const hasData = data.kpis !== null;

  if (!hasData) return <EmptyState />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <KPICards data={data} />

      {/* Headcount + Status */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6">
        <HeadcountChart data={data} />
        <div className="space-y-6">
          <StatusDistribuicaoChart data={data} />
          <AbsenciaResumoCard data={data} />
        </div>
      </div>

      {/* DISC + Mapa de Talentos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DiscDistribuicaoChart data={data} />
        {data.mapaTalentos.length > 0 && <MapaTalentosChart data={data} />}
      </div>
    </div>
  );
}
