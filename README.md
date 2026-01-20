# NestPoint: Platforma dla turystyki i wynajmu krótkoterminowego

Backend systemu do zarządzania wynajmem nieruchomości zbudowany przy użyciu Spring Boot, PostgreSQL i Redis.

## Uruchomienie projektu

Aby uruchomić system NestPoint, wykonaj następujące kroki:

1. Potrzebny jest Docker
2. Sklonuj repozytorium projektu/rozpakuj zip
3. Przejdź do katalogu projektu i uruchom:

```bash
docker-compose up
```

Ten komenda uruchomi:
- Bazę danych PostgreSQL na porcie 5432
- Serwer Redis na porcie 6379
- Backend aplikacji na porcie 8080

## Dostęp do API

- Serwer dostępny jest pod adresem: http://localhost:8080
- Dokumentacja Swagger: http://localhost:8080/swagger-ui.html

## Tworzenie administratora

Aby utworzyć konto administratora, wykonaj żądanie POST na endpoint `/register-admin` z następującym formatem danych:

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "securepassword",
  "firstName": "Admin",
  "lastName": "User",
  "phone": "123-456-7891",
  "secretKey": "super_secure_admin_key_2025"
}
```

## Role użytkowników

System obsługuje trzy role użytkowników:
- **OWNER** - właściciele nieruchomości na wynajem
- **TENANT** - najemcy szukający nieruchomości
- **ADMIN** - administratorzy systemu z pełnymi uprawnieniami

## Funkcjonalność WebSocket

System wykorzystuje WebSocket do obsługi komunikacji w czasie rzeczywistym dla:
- Licytacji w aukcjach nieruchomości
- Czatów między użytkownikami

Redis jest wykorzystywany do zarządzania połączeniami WebSocket.

## Swagger

Jest dostępny pod adresem http://localhost:8080/swagger-ui/index.html#/. Do swaggera należy się zalogować zarejestrowanym poprzez endpoint kontem aby móc testować endpointy z ograniczeniami ról (sam o to poprosi)!

## Uruchomienie testów

Aby uruchomić testy jednostkowe i integracyjne, użyj polecenia Maven:

```bash
mvn test
```

lub

```bash
mvn clean install
```

Aby wygenerować raport pokrycia kodu testami (używając JaCoCo):

```bash
mvn verify
```

Raport pokrycia będzie dostępny w katalogu `target/site/jacoco/index.html`.


## Zadania cykliczne (Scheduled Tasks)

Aplikacja wykorzystuje mechanizm zadań cyklicznych do automatycznego zarządzania danymi:

1. **Zarządzanie wynajmami**:
   - Aktualizacja statusów wynajmów (codziennie o północy) - zmiana PENDING→ACTIVE i ACTIVE→COMPLETED
   - Sprawdzanie terminów płatności (co 5 minut) - naliczanie kar za opóźnione płatności
   - Blokowanie użytkowników z nieopłaconymi karami (co godzinę)

2. **Zarządzanie aukcjami**:
   - Przetwarzanie statusów aukcji (co 30 sekund) - aktywacja i zakończenie aukcji
   - Czyszczenie nieaktualnych danych uczestników aukcji (co godzinę)

Te zadania działają automatycznie w tle i nie wymagają dodatkowej konfiguracji.

### Dostosowanie zadań cyklicznych

Wszystkie zadania cykliczne są skonfigurowane za pomocą adnotacji `@Scheduled` w klasach serwisowych:

1. **RentalService.java** zawiera:
   - `updateRentalStatuses()` - aktualizacja statusów wynajmów (@Scheduled cron = "0 0 0 * * ?") - codziennie o północy
   - `checkPaymentDeadlines()` - sprawdzanie terminów płatności (@Scheduled fixedRate = 300000) - co 5 minut (300000 ms)
   - `blockUsersWithUnpaidFees()` - blokowanie użytkowników z nieopłaconymi karami (@Scheduled fixedRate = 3600000) - co godzinę (3600000 ms)

2. **AuctionService.java** zawiera:
   - `processAuctionStatuses()` - przetwarzanie statusów aukcji (@Scheduled fixedRate = 30000) - co 30 sekund (30000 ms)
   - `cleanupOldAuctionData()` - czyszczenie danych uczestników aukcji (@Scheduled fixedRate = 3600000) - co godzinę (3600000 ms)

Aby zmodyfikować częstotliwość wykonywania tych zadań, zmień wartości parametrów adnotacji `@Scheduled`. Wartości dla parametru `fixedRate` są podane w milisekundach.