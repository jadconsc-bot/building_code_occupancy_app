export function getOccupancyAdvisorProjectDefaults(project: any | null | undefined) {
  if (!project) return { projectId: undefined, province: "", initialArea: undefined, initialFootprint: undefined, initialStoreys: undefined, initialOccupancy: undefined };
  return {
    projectId: project.id,
    province: project.province ?? "",
    initialArea: project.grossFloorArea ? Number(project.grossFloorArea) : undefined,
    initialFootprint: project.buildingFootprintJson?.value != null ? Number(project.buildingFootprintJson.value) : undefined,
    initialStoreys: project.storeys ?? undefined,
    initialOccupancy: project.occupancyCode ?? undefined,
  };
}
