from django.contrib import admin

from trading_core.models import Candidate, ExitSignal, Order, Position, Trade

admin.site.register(Candidate)
admin.site.register(Order)
admin.site.register(Position)
admin.site.register(ExitSignal)
admin.site.register(Trade)
