"""Compatibility command for the former one-shot callback registration."""

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Reconcile broker orders; order workers register their own callbacks.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING(
            'Callback registration lasts only for the current process. '
            'Broker order workers register callbacks before submission; '
            'running reconciliation instead.'
        ))
        call_command('reconcile_broker_orders', stdout=self.stdout)
