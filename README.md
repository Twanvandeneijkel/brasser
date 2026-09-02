# itdp-Twanvandeneijkel

## Over het project

**itdp-Twanvandeneijkel** is een persoonlijke webapplicatie gebouwd met het **Maestro PHP Framework**.

Het doel van dit project is om een overzichtelijke en onderhoudbare webapplicatie te bieden waarin persoonlijke informatie en features worden getoond.

> [!NOTE]
> Deze README is bedoeld voor zowel nieuwe ontwikkelaars als beoordelaars. Alle benodigde stappen om het project lokaal te installeren, te starten, te stoppen, te testen en te deployen worden hieronder uitgelegd.

---

## Features

- Persoonlijke portfolio webapplicatie
- Gebouwd met het Maestro PHP Framework
- Lokale ontwikkeling met SQLite
- Docker ondersteuning
- Docker Compose ondersteuning
- Handmatige database migraties
- Voorbereid op productie deployment
- CI controles via GitHub Actions
- Kwaliteitscontroles met PHPStan, PHPCS en Deptrac
- Ondersteuning voor repository pattern voor toekomstige databasewissels

---

## Technologieën

| Technologie | Doel |
|---|---|
| PHP | Programmeertaal van de applicatie |
| Maestro PHP Framework | Framework waarop de applicatie is gebouwd |
| Composer | Dependency management voor PHP packages |
| Docker | Containerisatie van de lokale ontwikkelomgeving |
| Docker Compose | Starten van meerdere containers met één commando |
| SQLite | Lokale development database |
| MySQL / PostgreSQL | Mogelijke relationele database voor productie |
| GitHub Actions | Continuous Integration bij pushes naar `main` |
| PHPStan | Statische code-analyse |
| PHPCS | Controle op PSR-12 code style |
| Deptrac | Controle op architectuurregels en dependencies |

---

## Vereisten

Zorg dat de volgende software geïnstalleerd is voordat je het project start:

| Vereiste | Beschrijving |
|---|---|
| Composer | Nodig om PHP dependencies te installeren |
| Docker Desktop | Nodig om containers lokaal te draaien |
| Maestro executable | Nodig om framework commando's zoals migraties en checks uit te voeren |
| Git | Nodig om het project te clonen |
| Terminal | Bijvoorbeeld PowerShell, Windows Terminal, macOS Terminal of Linux shell |

> [!IMPORTANT]
> Docker Desktop moet actief zijn voordat Docker- of Docker Compose-commando's uitgevoerd kunnen worden.

---

## Installatie

Clone eerst de repository naar je lokale machine:

```bash
git clone <repository-url>
cd itdp-Twanvandeneijkel
```

Dit commando downloadt het project vanaf GitHub en opent daarna de projectmap.

Installeer daarna de Composer dependencies:

```bash
composer install
```

Dit commando installeert alle PHP packages die nodig zijn om de applicatie lokaal te kunnen draaien.

> [!TIP]
> Wanneer je Composer lokaal niet geïnstalleerd hebt, kun je Composer ook via Docker uitvoeren. Dit wordt verderop uitgelegd bij de Docker-stappen.

---

## Local Development

Voor lokale ontwikkeling zijn er drie manieren om het project te draaien:

1. PHP lokaal draaien
2. Single Container met Docker
3. Docker Compose

De aanbevolen manier voor consistente development is **Docker Compose**, omdat hiermee de omgeving makkelijker opnieuw gestart kan worden.

---

### PHP lokaal draaien

Als PHP, Composer en de Maestro executable lokaal beschikbaar zijn, kun je de applicatie direct lokaal draaien.

Installeer dependencies:

```bash
composer install
```

Dit commando installeert alle PHP dependencies uit `composer.json`.

Voer database migraties uit:

```bash
php maestro migrate
```

Dit commando voert de database migraties uit en maakt de benodigde tabellen aan.

Start de lokale server volgens de instellingen van het Maestro Framework of je lokale webserverconfiguratie.

> [!WARNING]
> Zorg dat de SQLite database schrijfbaar is en dat de juiste rechten op de databasebestanden aanwezig zijn.

---

## Single Container (Docker)

Bij de single container setup draait zowel de webserver als de SQLite database binnen één Docker container. De applicatiebestanden worden gekoppeld via een volume, zodat wijzigingen lokaal direct beschikbaar zijn in de container.

Deze setup voldoet aan de eerste stap van opdrachtvereiste **3.5.1 Containers: Local Environment**.

---

### First Time Running

Voer de volgende commando's uit wanneer je het project voor de eerste keer met Docker start:

```bash
docker run --rm -v $PWD:/app composer install && docker build -t twanvandeneijkel ./
docker run -d --name twanvandeneijkel -v $PWD:/var/www/html -p 8888:80 twanvandeneijkel
docker exec twanvandeneijkel php maestro migrate
```

Het eerste commando gebruikt een Composer container om dependencies te installeren en bouwt daarna de Docker image met de naam `twanvandeneijkel`.

Het tweede commando start een nieuwe container met de naam `twanvandeneijkel`, koppelt de projectmap aan `/var/www/html` en maakt de applicatie bereikbaar via poort `8888`.

Het derde commando voert de database migraties uit binnen de draaiende container.

Na het starten is de applicatie bereikbaar via:

```text
http://localhost:8888
```

> [!IMPORTANT]
> Voer het migratiecommando pas uit nadat de container volledig is opgestart.

---

### Start

Gebruik deze commando's wanneer de Docker image al gebouwd is en je de container opnieuw wilt starten:

```bash
docker run -d --name twanvandeneijkel -v $PWD:/var/www/html -p 8888:80 twanvandeneijkel
docker exec twanvandeneijkel php maestro migrate
```

Het eerste commando start de container opnieuw op basis van de bestaande image.

Het tweede commando voert opnieuw de migraties uit, zodat de database up-to-date is.

> [!NOTE]
> Als er al een container met de naam `twanvandeneijkel` bestaat, moet je deze eerst stoppen en verwijderen met het stopcommando hieronder.

---

### Stop

Stop en verwijder de container met:

```bash
docker rm -f twanvandeneijkel
```

Dit commando stopt de container geforceerd en verwijdert deze daarna.

> [!WARNING]
> De container wordt verwijderd, maar projectbestanden blijven behouden omdat ze via een volume vanaf je lokale projectmap worden gekoppeld.

---

## Docker Compose

Docker Compose maakt het mogelijk om de applicatie met één commando te starten. Dit is overzichtelijker dan losse Docker commando's en sluit beter aan bij een professionele development workflow.

---

### Vereisten

Voor Docker Compose heb je nodig:

| Vereiste | Beschrijving |
|---|---|
| Docker Desktop | Bevat standaard Docker Compose |
| `docker-compose.yml` of `compose.yml` | Configuratiebestand voor de containers |
| Composer dependencies | Moeten geïnstalleerd zijn voordat de applicatie correct draait |

Controleer of Docker Compose beschikbaar is:

```bash
docker compose version
```

Dit commando toont de geïnstalleerde Docker Compose versie.

---

### First Time Running

Gebruik de volgende commando's wanneer je het project voor het eerst met Docker Compose start:

```bash
docker run --rm -v $PWD:/app composer install
docker compose up -d
docker compose exec app php maestro migrate
```

Het eerste commando installeert de Composer dependencies via een tijdelijke Composer container.

Het tweede commando start de containers op de achtergrond.

Het derde commando voert de database migraties uit in de `app` container.

> [!IMPORTANT]
> Het migrate-commando moet pas uitgevoerd worden nadat de container volledig is opgestart.

Na het starten is de applicatie bereikbaar via:

```text
http://localhost:8888
```

---

### Start

Start de Docker Compose omgeving met:

```bash
docker compose up -d
```

Dit commando start de container(s) op de achtergrond.

---

### Stop

Stop de Docker Compose omgeving met:

```bash
docker compose down
```

Dit commando stopt en verwijdert de containers die door Docker Compose zijn aangemaakt.

> [!TIP]
> Gebruik `docker compose up -d` opnieuw om de omgeving later weer te starten.

---

## Opdrachtvereiste 3.5.1 Containers: Local Environment

Deze applicatie voldoet aan de opdrachtvereisten voor **Containers: Local Environment**.

### 1. Single Docker container

In de eerste Docker setup wordt één container gebruikt waarin zowel de webserver als de SQLite databaseomgeving beschikbaar is. De applicatie draait binnen dezelfde container en wordt lokaal beschikbaar gemaakt via poort `8888`.

```bash
docker run -d --name twanvandeneijkel -v $PWD:/var/www/html -p 8888:80 twanvandeneijkel
```

Dit commando start de single container en koppelt de lokale projectmap aan de webservermap in de container.

---

### 2. Docker volumes voor data

De projectmap wordt via een Docker volume gekoppeld aan de container:

```bash
-v $PWD:/var/www/html
```

Hierdoor blijven bestanden lokaal beschikbaar en worden wijzigingen direct zichtbaar in de container.

> [!NOTE]
> SQLite data kan hierdoor lokaal persistent blijven zolang de databasebestanden in de gekoppelde projectmap staan.

---

### 3. Handmatige migraties

Database migraties worden bewust handmatig uitgevoerd:

```bash
docker exec twanvandeneijkel php maestro migrate
```

Dit commando voert de migraties uit in de draaiende Docker container.

Handmatige migraties zorgen ervoor dat de ontwikkelaar controle houdt over wanneer databasewijzigingen worden toegepast.

---

### 4. Docker Compose met één commando

Met Docker Compose kan dezelfde container gestart worden met één hoofdcommando:

```bash
docker compose up -d
```

Dit commando start de applicatiecontainer op de achtergrond volgens de instellingen in het Compose-bestand.

Daarna kunnen migraties uitgevoerd worden met:

```bash
docker compose exec app php maestro migrate
```

Dit commando voert de migraties uit binnen de `app` container.

---

### 5. Uitgebreidere architectuur met aparte databasecontainer

In een uitgebreidere architectuur kan de database worden opgesplitst naar een aparte container, bijvoorbeeld met:

- MySQL
- PostgreSQL
- MariaDB

De webservercontainer en databasecontainer communiceren dan met elkaar via een Docker network.

Een voorbeeldarchitectuur kan bestaan uit:

| Container | Verantwoordelijkheid |
|---|---|
| `app` | PHP applicatie en webserver |
| `database` | MySQL of PostgreSQL database |
| `network` | Interne communicatie tussen containers |
| `volume` | Persistente databaseopslag |

> [!TIP]
> Deze architectuur is beter geschikt voor productieachtige development environments, omdat de applicatie en database duidelijk gescheiden zijn.

---

### 6. Repository pattern voor databasewissels

Het repository pattern kan gebruikt worden om databasewissels mogelijk te maken zonder grote wijzigingen in controllers of business logic.

In plaats van direct SQL queries uit te voeren in controllers, wordt databasecommunicatie afgehandeld via repository classes en interfaces.

Voorbeeld:

```text
Controller -> RepositoryInterface -> SQLiteRepository
Controller -> RepositoryInterface -> MySQLRepository
Controller -> RepositoryInterface -> PostgreSQLRepository
```

Door deze structuur kan de onderliggende database aangepast worden, terwijl de rest van de applicatie grotendeels hetzelfde blijft.

---

## Deployment (Production)

### Opdrachtvereiste 3.5.2

Voor productie kan de applicatie gepubliceerd worden op een hostingomgeving met ondersteuning voor PHP en een relationele database zoals MySQL.

Het gebruikte domein voor deze applicatie is:

```text
twanvandeneijkel.com
```

---

### 1. Hosting aanschaffen

Kies een hostingprovider die minimaal ondersteuning biedt voor:

| Onderdeel | Vereiste |
|---|---|
| PHP | Geschikte PHP-versie voor het project |
| Database | MySQL of vergelijkbare relationele database |
| SSH toegang | Nodig voor deployment en migraties |
| Domeinbeheer | Nodig voor koppeling van het domein |
| HTTPS / SSL | Nodig voor veilige verbindingen |

Na aanschaf ontvang je meestal toegang tot een hostingdashboard zoals cPanel, Plesk of een eigen providerpaneel.

---

### 2. Domeinnaam koppelen

Koppel het domein aan de hostingomgeving via DNS instellingen.

Voor het domein:

```text
twanvandeneijkel.com
```

moeten meestal één of meerdere DNS-records ingesteld worden.

Voorbeeld:

| Type | Naam | Waarde |
|---|---|---|
| A-record | `@` | IP-adres van de server |
| CNAME | `www` | `twanvandeneijkel.com` |

> [!WARNING]
> DNS wijzigingen kunnen enige tijd nodig hebben voordat ze wereldwijd actief zijn.

---

### 3. HTTPS configureren

HTTPS wordt geconfigureerd met een SSL-certificaat. Veel hostingproviders bieden gratis SSL aan via Let's Encrypt.

Controleer in het hostingpaneel of SSL actief is voor:

```text
twanvandeneijkel.com
www.twanvandeneijkel.com
```

Na activatie moet de website bereikbaar zijn via:

```text
https://twanvandeneijkel.com
```

> [!IMPORTANT]
> Gebruik in productie altijd HTTPS om gebruikersgegevens en sessies veilig te versturen.

---

### 4. Applicatie publiceren

De applicatie kan gepubliceerd worden via:

- Git deployment
- SFTP
- SSH
- Een hosting dashboard
- Een CI/CD pipeline

Een veelgebruikte aanpak is:

```bash
git pull origin main
composer install --no-dev --optimize-autoloader
php maestro migrate
```

Het eerste commando haalt de nieuwste versie van de `main` branch op.

Het tweede commando installeert alleen productie-dependencies en optimaliseert de autoloader.

Het derde commando voert database migraties uit op de productieomgeving.

> [!WARNING]
> Maak altijd een backup van de database voordat migraties in productie worden uitgevoerd.

---

### 5. Nieuwe versies uitrollen

Een nieuwe versie kan worden uitgerold door de laatste code van GitHub op de server te plaatsen.

Typische stappen:

```bash
git pull origin main
composer install --no-dev --optimize-autoloader
php maestro migrate
```

Dit werkt de code bij, installeert eventuele nieuwe dependencies en past databasewijzigingen toe.

> [!TIP]
> Test nieuwe versies eerst lokaal of op een stagingomgeving voordat ze naar productie worden uitgerold.

---

### 6. Migraties uitvoeren via SSH

Migraties kunnen op de server worden uitgevoerd via SSH.

Maak verbinding met de server:

```bash
ssh gebruikersnaam@hostnaam -p poort
```

Dit commando maakt via SSH verbinding met de server.

Ga naar de projectmap:

```bash
cd pad/naar/project
```

Dit commando opent de map waarin de applicatie op de server staat.

Voer daarna de migraties uit:

```bash
php maestro migrate
```

Dit commando voert de database migraties uit op de productieomgeving.

---

### 7. Gebruik van PuTTY of vergelijkbare SSH software

Op Windows kan PuTTY gebruikt worden om verbinding te maken met de server.

Benodigde stappen:

1. Open PuTTY
2. Vul de hostnaam in
3. Vul de poort in
4. Kies verbindingstype SSH
5. Klik op Open
6. Log in met gebruikersnaam en wachtwoord
7. Navigeer naar de projectmap
8. Voer deployment- of migratiecommando's uit

---

### 8. Benodigde gegevens voor SSH

Voor toegang tot de server zijn meestal de volgende gegevens nodig:

| Gegeven | Beschrijving |
|---|---|
| Hostnaam | Serveradres of IP-adres |
| Gebruikersnaam | SSH gebruikersnaam |
| Wachtwoord | Wachtwoord of private key |
| Poort | Meestal `22`, tenzij anders ingesteld |

> [!IMPORTANT]
> Deel SSH gegevens nooit openbaar en commit ze nooit naar GitHub.

---

### 9. `index.php` aanpassen voor correcte homepage

Voor productie moet gecontroleerd worden of de webserver naar de juiste public directory verwijst.

Als de homepage niet correct geladen wordt, controleer dan of `index.php` goed verwijst naar de juiste bootstrap- of routerbestanden van de applicatie.

Voorbeeld aandachtspunten:

```php
require_once __DIR__ . '/../vendor/autoload.php';
```

Deze regel laadt Composer dependencies vanuit de juiste locatie.

Controleer daarnaast of de document root van de hostingprovider verwijst naar de map waar `index.php` staat.

> [!WARNING]
> Een verkeerde document root of fout pad in `index.php` kan ervoor zorgen dat de homepage niet geladen wordt.

---

## CI/CD

GitHub Actions draait automatisch bij iedere push naar de `main` branch.

De workflow controleert de codekwaliteit en architectuur van het project. Alle checks moeten succesvol zijn voordat de wijzigingen als betrouwbaar worden beschouwd.

| Check | Commando | Doel | Resultaat bij falen |
|---|---|---|---|
| PHPStan level 8 | `php maestro phpstan` | Controleert typefouten en mogelijke bugs via statische analyse | Workflow faalt |
| PHPCS PSR-12 | `php maestro phpcs` | Controleert of de code voldoet aan PSR-12 coding standards | Workflow faalt |
| Deptrac | `php maestro deptrac` | Controleert of architectuurregels en dependency lagen worden gerespecteerd | Workflow faalt |

Wanneer één van deze checks faalt, faalt de volledige workflow. De developer wordt automatisch geïnformeerd via GitHub Actions, bijvoorbeeld via de GitHub interface of notificaties.

> [!IMPORTANT]
> Code mag pas als kwalitatief correct worden beschouwd wanneer alle CI checks succesvol zijn.

---

## Lokale kwaliteitscontroles

Dezelfde checks die in CI/CD draaien, kunnen ook lokaal uitgevoerd worden.

> [!NOTE]
> De onderstaande commando's gaan ervan uit dat de Docker container `twanvandeneijkel` actief is.

---

### PHPStan

```bash
docker exec twanvandeneijkel php maestro phpstan
```

Dit commando voert PHPStan uit en controleert de code op typefouten, ongeldige method calls, ontbrekende properties en andere statische analyseproblemen.

---

### PHPCS

```bash
docker exec twanvandeneijkel php maestro phpcs
```

Dit commando controleert of de code voldoet aan de PSR-12 coding standard.

---

### Deptrac

```bash
docker exec twanvandeneijkel php maestro deptrac
```

Dit commando controleert of de architectuurregels worden nageleefd en of onderdelen van de applicatie niet afhankelijk zijn van verkeerde lagen.

---

## Troubleshooting

### Docker container start niet

Controleer of Docker Desktop actief is:

```bash
docker version
```

Dit commando controleert of Docker beschikbaar is op je systeem.

Controleer of er al een container met dezelfde naam bestaat:

```bash
docker ps -a
```

Dit commando toont alle containers, inclusief gestopte containers.

Verwijder eventueel de bestaande container:

```bash
docker rm -f twanvandeneijkel
```

Dit commando verwijdert de bestaande container, zodat je deze opnieuw kunt starten.

---

### Composer dependencies ontbreken

Installeer de dependencies opnieuw:

```bash
composer install
```

Dit commando installeert alle benodigde PHP dependencies lokaal.

Of gebruik Composer via Docker:

```bash
docker run --rm -v $PWD:/app composer install
```

Dit commando gebruikt een tijdelijke Composer container om dependencies te installeren.

---

### Database migraties falen

Controleer eerst of de container draait:

```bash
docker ps
```

Dit commando toont alle actieve containers.

Voer daarna de migraties opnieuw uit:

```bash
docker exec twanvandeneijkel php maestro migrate
```

Dit commando voert de migraties uit binnen de draaiende container.

> [!TIP]
> Controleer bij SQLite problemen of de databasebestanden schrijfbaar zijn.

---

### Poort 8888 is al in gebruik

Controleer welke containers draaien:

```bash
docker ps
```

Dit commando toont actieve containers en hun gebruikte poorten.

Stop de bestaande container die poort `8888` gebruikt, of wijzig de poortmapping.

Voorbeeld alternatieve poort:

```bash
docker run -d --name twanvandeneijkel -v $PWD:/var/www/html -p 8889:80 twanvandeneijkel
```

Dit commando start de applicatie op lokale poort `8889` in plaats van `8888`.

De applicatie is dan bereikbaar via:

```text
http://localhost:8889
```

---

### Docker Compose lock error

Als Docker Compose meldt dat er nog een proces draait, controleer actieve Docker processen:

```bash
docker compose ps
```

Dit commando toont de containers van het Compose project.

Stop daarna de omgeving:

```bash
docker compose down
```

Dit commando stopt en verwijdert de Compose containers.

---

### Applicatie toont een lege pagina

Controleer of dependencies geïnstalleerd zijn:

```bash
composer install
```

Dit commando installeert ontbrekende dependencies.

Controleer daarna of migraties zijn uitgevoerd:

```bash
php maestro migrate
```

Dit commando maakt of update de benodigde database tabellen.

> [!WARNING]
> Een lege pagina kan ook veroorzaakt worden door PHP errors. Controleer in dat geval de logs van Docker of de hostingprovider.

---

## Projectstructuur

Een mogelijke projectstructuur ziet er als volgt uit:

```text
itdp-Twanvandeneijkel/
├── app/
│   ├── Controllers/
│   ├── Models/
│   ├── Repositories/
│   └── Services/
├── database/
│   ├── migrations/
│   └── database.sqlite
├── public/
│   └── index.php
├── resources/
│   └── views/
├── routes/
│   └── web.php
├── tests/
├── vendor/
├── .github/
│   └── workflows/
│       └── ci.yml
├── composer.json
├── composer.lock
├── deptrac.yaml
├── Dockerfile
├── docker-compose.yml
├── maestro
└── README.md
```

Deze structuur scheidt applicatielogica, databasebestanden, publieke bestanden, routes, tests, Docker configuratie en CI/CD configuratie.

> [!NOTE]
> De exacte mappenstructuur kan afwijken afhankelijk van de projectimplementatie, maar bovenstaande structuur geeft een duidelijk voorbeeld van een professionele indeling.

---

## Contributing

Nieuwe ontwikkelaars kunnen bijdragen door onderstaande stappen te volgen:

1. Clone de repository
2. Maak een nieuwe branch
3. Installeer dependencies
4. Start de lokale ontwikkelomgeving
5. Voer migraties uit
6. Maak wijzigingen
7. Draai lokale kwaliteitscontroles
8. Commit en push de wijzigingen
9. Maak een pull request

Maak een nieuwe branch:

```bash
git checkout -b feature/naam-van-feature
```

Dit commando maakt een nieuwe feature branch aan en schakelt daar direct naartoe.

Controleer de codekwaliteit voordat je pusht:

```bash
docker exec twanvandeneijkel php maestro phpstan
docker exec twanvandeneijkel php maestro phpcs
docker exec twanvandeneijkel php maestro deptrac
```

Deze commando's voeren dezelfde kwaliteitscontroles uit als de GitHub Actions workflow.

Commit je wijzigingen:

```bash
git add .
git commit -m "Beschrijf de wijziging"
git push origin feature/naam-van-feature
```

Deze commando's voegen wijzigingen toe, maken een commit en pushen de branch naar GitHub.

> [!IMPORTANT]
> Push geen gevoelige gegevens zoals wachtwoorden, `.env` bestanden, database dumps of SSH gegevens naar de repository.

---

## License

Dit project is gemaakt als onderdeel van een HBO-softwareontwikkeling opdracht.

Gebruik, verspreiding en aanpassing van dit project zijn afhankelijk van de licentievoorwaarden die door de projecteigenaar of opleiding worden vastgesteld.

Wanneer er een aparte `LICENSE` file aanwezig is in de repository, heeft die licentie voorrang op deze tekst.