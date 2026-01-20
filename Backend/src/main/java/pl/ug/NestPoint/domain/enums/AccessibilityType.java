package pl.ug.NestPoint.domain.enums;

public enum AccessibilityType {
    PRIVATE("Private access"),
    NONE("Not available"),
    SHARED("Shared access"),
    NOT_APPLICABLE("N/A");

    private final String description;

    AccessibilityType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}