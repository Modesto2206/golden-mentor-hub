import { useState, useMemo, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Phone, Mail, MapPin, User, ArrowRightLeft, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import { useLeads, PIPELINE_STAGES, Lead } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

const Pipeline = () => {
  const { leads, isLoading, updateStage, convertToClient, isConverting } = useLeads();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (search) {
        const s = search.toLowerCase();
        if (!lead.name.toLowerCase().includes(s) && !(lead.phone || "").includes(s) && !(lead.cpf || "").includes(s)) return false;
      }
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      return true;
    });
  }, [leads, search, sourceFilter]);

  const leadsByStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const stage of PIPELINE_STAGES) {
      map[stage.key] = filteredLeads.filter((l) => l.pipeline_stage === stage.key);
    }
    return map;
  }, [filteredLeads]);

  const sources = useMemo(() => {
    const set = new Set(leads.map((l) => l.source).filter(Boolean));
    return Array.from(set) as string[];
  }, [leads]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStage = result.destination.droppableId;
    const previousStage = result.source.droppableId;
    if (newStage === previousStage) return;
    updateStage({ leadId, newStage, previousStage });
  }, [updateStage]);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">Pipeline de Vendas</h1>
            <p className="text-sm text-muted-foreground">Arraste os leads entre as etapas do funil</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-48" />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-1" />
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas origens</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((s) => (
              <div key={s.key} className="min-w-[260px] space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4 min-h-[60vh]">
              {PIPELINE_STAGES.map((stage) => (
                <Droppable key={stage.key} droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-w-[250px] w-[250px] flex-shrink-0 rounded-lg border border-border/50 bg-muted/30 p-2 transition-colors",
                        snapshot.isDraggingOver && "bg-primary/5 border-primary/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-semibold text-sm">{stage.label}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {leadsByStage[stage.key]?.length || 0}
                        </Badge>
                      </div>
                      <div className="space-y-2 min-h-[100px]">
                        {leadsByStage[stage.key]?.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={cn(
                                  "rounded-md border border-border/60 bg-card p-3 shadow-sm transition-shadow cursor-grab active:cursor-grabbing",
                                  dragSnapshot.isDragging && "shadow-lg ring-2 ring-primary/30",
                                  lead.converted_to_client && "opacity-60"
                                )}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <p className="font-medium text-sm leading-tight truncate">{lead.name}</p>
                                  {lead.converted_to_client && (
                                    <Badge variant="outline" className="text-[10px] shrink-0">Convertido</Badge>
                                  )}
                                </div>
                                {lead.phone && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3" />{lead.phone}
                                  </p>
                                )}
                                {lead.source && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <User className="w-3 h-3" />{lead.source}
                                  </p>
                                )}
                                {(lead.city || lead.state) && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />{[lead.city, lead.state].filter(Boolean).join(", ")}
                                  </p>
                                )}
                                {!lead.converted_to_client && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="mt-2 h-7 text-xs w-full"
                                        disabled={isConverting}
                                        onClick={(e) => { e.stopPropagation(); convertToClient(lead); }}
                                      >
                                        <ArrowRightLeft className="w-3 h-3 mr-1" />
                                        Converter em Cliente
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Cria um registro na tabela de clientes</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </AppLayout>
  );
};

export default Pipeline;
