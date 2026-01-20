package pl.ug.NestPoint.domain.enums;

public enum PropertyType {
    ROOM("Single room"),
    APARTMENT("Full apartment"),
    PROPERTY("Entire property");

    private final String description;

    PropertyType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}