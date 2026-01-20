package pl.ug.NestPoint.domain.enums;

public enum Role {
    // Standardize role names with database constraints
    CLIENT,
    OWNER, 
    TENANT,
    ADMIN;
    
    // For customization of role names in the UI
    private String displayName;
    
    Role() {
        this.displayName = name();
    }
    
    Role(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return this.displayName;
    }
}