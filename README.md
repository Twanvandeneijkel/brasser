# Brassers

Brassers is een SvelteKit-applicatie voor winkelvoorraad, productieadvies, recepten, grondstoffen en voedingswaarden. De serverlaag gebruikt TypeScript, Prisma en SQLite. De domeinen `auth`, `stock`, `recipes`, `nutrition` en `excel` zijn als losse services opgebouwd, zodat ze later onafhankelijk als echte netwerk-microservices kunnen worden uitgeplaatst.

## Starten (zonder Docker)

Installeer Node.js 24 of nieuwer en voer daarna uit:

```powershell
npm install
npm run dev -- --open
```

`npm run dev` genereert de Prisma-client, voert nog niet toegepaste migraties uit en maakt de basisgegevens aan. De lokale database staat in `data/brassers.db` en wordt niet in Git opgeslagen.

Voor een productiebuild:

```powershell
npm run build
npm start
```

## Functies

- Beveiligde login met rollen voor beheerder en alleen-lezen gebruiker.
- Producten met meerdere gewichtsvarianten.
- Live voorraadtellingen, vakcapaciteit, eenheden per productieronde en productieadvies.
- Voorraadhistorie met gebruiker, tijdstip en notitie.
- Grondstoffen en recepten per productvariant.
- Automatisch berekende voedingswaarden en kopieerbare etikettekst.
- Excel-export naar `Excel/Brassers_beheer.xlsx`; het werkboek blijft zelfstandig bruikbaar.

## Beveiliging

- Wachtwoorden worden met Argon2id gehasht; een bestaand bcrypt-wachtwoord wordt na een geldige login automatisch opgewaardeerd.
- Sessies gebruiken willekeurige tokens. Alleen de SHA-256-hash staat in de database.
- Cookies zijn `HttpOnly`, `SameSite=Lax` en in productie `Secure` met de `__Host-`-prefix.
- Formulierinvoer wordt server-side met Zod gevalideerd.
- Mutaties zijn alleen toegestaan voor de beheerder en loginpogingen zijn gelimiteerd.
- SvelteKit controleert de request-origin voor formulieracties en de server stuurt aanvullende securityheaders.

## Database en controles

```powershell
npm run db:migrate   # nieuwe ontwikkelmigratie maken
npm run db:deploy    # bestaande migraties toepassen
npm run db:seed      # basisaccounts en voorbeeldproducten
npm run validate     # types, format, lint, tests en productiebuild
```

De basisgebruiker `brasser` heeft wachtwoord `fitkoren` en alleen-lezen toegang. Het beheerdersaccount is `twan`; het bestaande wachtwoord is bij de migratie behouden.
