"""Run the bundled Django/Channels investment service under Lexicon."""

import os
import sys
from threading import Thread


def main():
    if len(sys.argv) > 1 and sys.argv[1] == 'notes_cli':
        import logging
        logging.disable(logging.CRITICAL)
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        from django.core.management import execute_from_command_line
        execute_from_command_line(['manage.py', *sys.argv[1:]])
        return
    if len(sys.argv) != 2 or not sys.argv[1].isdigit():
        raise SystemExit('Usage: lexicon_service.py <port>')
    port = int(sys.argv[1])
    if not 1024 <= port <= 65535:
        raise SystemExit('Invalid port')
    os.environ['LEXICON_INVESTMENT_PORT'] = str(port)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

    import django
    django.setup()
    from django.core.management import call_command

    call_command('migrate', interactive=False, verbosity=0)

    from backend.asgi import application
    from daphne.server import Server
    from twisted.internet import reactor

    def stop_when_parent_closes():
        for line in sys.stdin:
            if line.strip() == 'shutdown':
                break
        reactor.callFromThread(reactor.stop)

    Thread(target=stop_when_parent_closes, daemon=True).start()

    Server(application=application, endpoints=[f'tcp:port={port}:interface=127.0.0.1'], signal_handlers=False).run()


if __name__ == '__main__':
    main()
