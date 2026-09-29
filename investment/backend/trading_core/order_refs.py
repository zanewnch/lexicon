"""Stable six-character Shioaji custom_field values for local orders."""


def make_client_ref(order_id: int) -> str:
    digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    value = order_id
    encoded = ''
    while value:
        value, remainder = divmod(value, 36)
        encoded = digits[remainder] + encoded
    encoded = encoded or '0'
    if len(encoded) > 5:
        raise ValueError('Local order ID exceeds broker custom_field capacity')
    return 'P' + encoded.rjust(5, '0')
