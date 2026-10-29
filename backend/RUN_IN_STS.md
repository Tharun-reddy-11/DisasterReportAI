# Run the API in Spring Tool Suite

1. Open **Run Configurations** for `Application`.
2. On **Environment**, add `SPRING_DATASOURCE_PASSWORD` with the password for your local MySQL `root` user. Do not put it in `application.yml`.
3. Confirm MySQL is running and the `disasterreport` database exists.
4. Run `Application` as a Spring Boot App.
5. Open `http://localhost:8080/api/health`. It must return `{"status":"UP","service":"disasterreport-api"}` before attempting account registration.

If an earlier run is active, stop it in STS and launch it again after pulling these changes. The API now maps report-analysis JSON and summaries as MySQL `LONGTEXT`, so Hibernate creates `report_analyses` without the InnoDB row-size error. The earlier failed startup did not create that table, so no database cleanup is required.

The API defaults to `jdbc:mysql://127.0.0.1:3306/disasterreport`. You can override the URL and username with `SPRING_DATASOURCE_URL` and `SPRING_DATASOURCE_USERNAME` when needed.
