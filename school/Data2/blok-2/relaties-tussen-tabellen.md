# Relaties tussen tabellen

In een database staan tabellen niet los van elkaar. Ze zijn met elkaar verbonden via relaties. Dit betekent dat gegevens uit de ene tabel gekoppeld zijn aan gegevens in een andere tabel.

Zo'n relatie wordt meestal gemaakt met:
- een **primary key** → unieke waarde in een tabel (bijv. `user_id`)
- een **foreign key** → verwijzing naar die waarde in een andere tabel

Voorbeeld van een relatie:
- tabel `users` bevat `user_id` (primary key)
- tabel `orders` bevat ook `user_id` (foreign key)

Dit betekent: elke bestelling hoort bij een specifieke gebruiker.
