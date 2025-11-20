import ZoneBadge from "../ZoneBadge";

export default function ZoneBadgeExample() {
  return (
    <div className="flex flex-col gap-6 p-6 bg-background">
      <div>
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Small Size</h3>
        <div className="flex flex-wrap gap-3">
          <ZoneBadge type="success" size="sm" data-testid="zone-success-sm" />
          <ZoneBadge type="warning" size="sm" data-testid="zone-warning-sm" />
          <ZoneBadge type="critical" size="sm" data-testid="zone-critical-sm" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Medium Size (Default)</h3>
        <div className="flex flex-wrap gap-3">
          <ZoneBadge type="success" data-testid="zone-success-md" />
          <ZoneBadge type="warning" data-testid="zone-warning-md" />
          <ZoneBadge type="critical" data-testid="zone-critical-md" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Large Size with Custom Labels</h3>
        <div className="flex flex-wrap gap-3">
          <ZoneBadge type="success" label="Zona Kinerja" size="lg" data-testid="zone-success-lg" />
          <ZoneBadge type="warning" label="Zona Perilaku" size="lg" data-testid="zone-warning-lg" />
          <ZoneBadge type="critical" label="Perlu Perbaikan" size="lg" data-testid="zone-critical-lg" />
        </div>
      </div>
    </div>
  );
}
