// Test data builders for flexible test data creation

export class UserBuilder {
  private user: any = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User'
  };

  withId(id: string) {
    this.user.id = id;
    return this;
  }

  withEmail(email: string) {
    this.user.email = email;
    return this;
  }

  withRole(role: string) {
    this.user.role = role;
    return this;
  }

  build() {
    return { ...this.user };
  }
}

export class BuildingBuilder {
  private building: any = {
    id: 'building-1',
    name: 'Test Building',
    organization_id: 'org-1'
  };

  withId(id: string) {
    this.building.id = id;
    return this;
  }

  withName(name: string) {
    this.building.name = name;
    return this;
  }

  withMetrics(metrics: any) {
    this.building.metrics = metrics;
    return this;
  }

  build() {
    return { ...this.building };
  }
}
