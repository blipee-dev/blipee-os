FROM pgbouncer/pgbouncer:1.22.0

# Install additional tools
USER root
RUN apk add --no-cache postgresql-client

# Copy configuration
COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY userlist.txt /etc/pgbouncer/userlist.txt

# Set permissions
RUN chown -R pgbouncer:pgbouncer /etc/pgbouncer

USER pgbouncer

EXPOSE 6432

CMD ["pgbouncer", "/etc/pgbouncer/pgbouncer.ini"]