# NestPoint: Platform for Tourism and Short-Term Rentals

Frontend system for managing property rentals built using **Next.js**.

## Running the Project

To run the NestPoint frontend, follow these steps:

1. Docker is required
2. Clone the project repository or extract the ZIP archive
3. Navigate to the project directory and run:

```bash
docker compose -f docker-compose.prod.yml up --build
```

This command will build the Frontend service and expose it on port **3000**.

Alternatively, you can run the development environment using the command below. Note, however, that it will not perform as smoothly as the production version.

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Running Tests

To run Vitest tests, navigate to the project directory and run:

```bash
pnpm run test
```

To run Vitest tests and generate code coverage data, run:

```bash
pnpm run test:coverage
```

## Client Application Access

* The application client is available at: [http://localhost:3000](http://localhost:3000)

## Login and Registration

Before logging in, users can only browse listings and their details.
To proceed, a user must first create an account. By clicking the *Login* button in the navbar, the user is redirected to the authorization page **/login**, where they can either log in or register.

Available roles during registration are **Tenant** and **Owner**:

* **Tenant** can book listings
* **Owner** can create and manage listings

After completing the registration form, the user is automatically logged in.

## Home Page

On the home page **/landing-page**, users can see current application statistics, a link encouraging them to browse listings, and an animated map demonstrating the core map functionality of the application. The map also presents the **5 most recent available listings** along with their locations.

## Listings Page

By clicking the *Listings* button in the navbar, the user is taken to the **/apartment-list** page, where available rental listings can be searched and filtered. Search criteria include:

* Location
* Price
* Listing details (number of beds, size, amenities, etc.)
* Auction availability
* Availability within a selected date range (chosen via a calendar)

The *View on Map* button opens a modal with an interactive map, making it easier to search listings by location. The map also includes search filters and an option to switch to satellite view.

## Adding Listings

By clicking the *Add Apartment* button in the navbar, a logged-in **Owner** can add a new listing. The process includes:

1. Filling in the title, description, price per night, and available amenities
2. Providing the address manually or opening a map to locate and select the building (clicking the building highlights its outline and automatically fills in the address fields)
3. Adding photos from disk or via drag & drop

After confirming the data, the user is redirected to the listings page.

## Listing Page

Selecting a listing from the list navigates the user to the listing details page. This page allows users to view listing information and manage rentals.

* Clicking on a photo opens an interactive gallery
* Below the gallery is the listing description and a section with a minimap (interactive, with a highlighted building outline and satellite view toggle) and address
* The key data section displays available amenities, surface area, and additional fees
* The **payment info** section is used to manage rentals and displays pricing information
* At the bottom of the page, there is a reviews section

## Auctions

There are two rental options: standard rental and auction-based rental.

On the listing details page, the payment section includes a calendar:

* Gray dates indicate unavailable dates (past or already booked)
* Burgundy dates indicate auction dates for the listing

The **Owner** can select a date range on the calendar to host an auction, which opens a modal with an auction creation form (alternatively, the *Start Auction* button can be used). The owner fills in auction details, including:

* Auction date
* Rental date

Multiple auctions can be created for different future dates. Auction details can be viewed by clicking the corresponding burgundy-highlighted date on the calendar.

Auction details are visible to both **Owner** and **Tenant**. When the auction date and time arrive, the auction status changes to active (with a possible delay of about one minute). At that point, **Tenants** can place bids by entering their bid amount and confirming.

Via WebSocket, the **Highest Bid** value updates in real time (for the first bid, there may be a delay of about 20 seconds; subsequent bids appear immediately).

Each tenant has a **15-minute cooldown**, during which they cannot place another bid (a timer is displayed). Other tenants may continue bidding during this time.

When the auction ends, a **rental** is created for the winning tenant, who must complete the payment. A yellow notification appears with payment instructions and a button to proceed. This opens a modal where a 10-digit credit card number must be entered.

As part of the payment simulation, there is a small chance that the payment will fail, in which case the user is notified and must retry until successful.

If the rental is not paid within **24 hours**, a monetary penalty is applied to the tenant. Until the penalty is paid, the tenant cannot create new reservations. The unpaid listing page also displays further instructions (the penalty can be paid from the tenant’s profile).

## Standard Rental

A tenant can also select any available date that is not associated with an auction and book the listing at a fixed price. Clicking **Book Apartment Now** opens a payment modal where the tenant:

* Selects the rental date
* Sees the calculated price
* Enters a credit card number (payment is simulated here as well)

## Chats

After a rental payment is accepted, a WebSocket connection is opened for chat communication between the owner and the tenant. The chat is accessible via the envelope icon in the navbar.

Clicking the icon opens a modal with available conversations. Selecting one activates the chat window. All chat communication happens in real time via WebSocket.

## Reviews

After the rental period ends, the tenant can leave a review by entering a comment and selecting a star rating. After submitting a review, the tenant can edit or delete it directly from the same section.

## Editing Listings

An owner who created a listing can:

* Delete it (provided no auctions are associated with it)
* Edit it freely

Clicking the edit button on the listing page opens a form similar to the listing creation form, pre-filled with existing data. The owner can modify any details (including photos) and confirm the changes.

## User Profiles

The user profile is accessible via the username badge in the navbar. The profile panel displays user data and options for browsing and managing associated listings.

* **Tenant** users see all purchased rentals as well as unpaid payments and penalties
* **Owner** users see a list of owned properties and shared rentals

## Admin Panel

Users with the **Admin** role have access to all editing and deletion operations across the application (editing and deleting listings, reviews, etc.).

In the admin panel (accessible via the navbar badge), the admin can view:

* A list of users grouped by role
* NestPoint service statistics
* A list of all rentals with search functionality

The admin also has the ability to delete users who have no associated rentals.

