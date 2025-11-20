import ProfileBadge from "../ProfileBadge";

export default function ProfileBadgeExample() {
  return (
    <div className="flex flex-col gap-6 p-6 bg-background">
      <div>
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">All Profile Types</h3>
        <div className="flex flex-wrap gap-3">
          <ProfileBadge type="Leader" data-testid="profile-leader" />
          <ProfileBadge type="Visionary" data-testid="profile-visionary" />
          <ProfileBadge type="Performer" data-testid="profile-performer" />
          <ProfileBadge type="At-Risk" data-testid="profile-at-risk" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Large Size</h3>
        <div className="flex flex-wrap gap-3">
          <ProfileBadge type="Leader" size="lg" data-testid="profile-leader-lg" />
          <ProfileBadge type="Visionary" size="lg" data-testid="profile-visionary-lg" />
          <ProfileBadge type="Performer" size="lg" data-testid="profile-performer-lg" />
          <ProfileBadge type="At-Risk" size="lg" data-testid="profile-at-risk-lg" />
        </div>
      </div>
    </div>
  );
}
