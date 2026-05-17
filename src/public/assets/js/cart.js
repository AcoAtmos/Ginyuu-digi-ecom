
const CART_KEY = 'ginyuu_guest_cart';

export const Cart = {
    _isLoggedIn: false,
    _onExpired: null,
    _onDuplicate: null,

    onSessionExpired(callback) {
        this._onExpired = callback;
    },
    onDuplicate(callback) {
        this._onDuplicate = callback;
    },
    setLoggedIn(status) {
        this._isLoggedIn = status;
    },

    async getAll() {
        if (this._isLoggedIn) {
            try {
                const res = await fetch(`/api/cart`, { credentials: 'include' });
                if (res.status === 401 || res.status === 403) {
                    this._handleSessionExpired();
                    return [];
                }
                if (res.ok) {
                    const json = await res.json();
                    return json.data?.items || [];
                }
            } catch (err) {
            }
            return [];
        }
        return this.getLocalItems();
    },

    async add(productId) {
        if (this._isLoggedIn) {
            try {
                const res = await fetch(`/api/cart`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: productId })
                });
                if (res.status === 401 || res.status === 403) {
                    this._handleSessionExpired();
                    return this._addToLocal(productId);
                }
                if (res.ok) {
                    const json = await res.json();
                    if (json.status === 'duplicate') {
                        if (this._onDuplicate) this._onDuplicate();
                        return { status: 'duplicate', message: json.message };
                    }
                    return { status: 'success' };
                }
            } catch (err) {
            }
            return { status: 'error' };
        }
        return this._addToLocal(productId);
    },

    _addToLocal(productId) {
        const items = this.getLocalItems();
        const existing = items.find(i => i.id == productId);
        if (existing) {
            if (this._onDuplicate) this._onDuplicate();
            return { status: 'duplicate', message: 'This product is already in your cart' };
        }
        items.push({ id: productId });
        this.saveLocalItems(items);
        return { status: 'success' };
    },

    async remove(productId) {
        if (this._isLoggedIn) {
            try {
                const res = await fetch(`/api/cart/${productId}`, {
                    method: 'DELETE', credentials: 'include'
                });
                if (res.status === 401 || res.status === 403) {
                    this._handleSessionExpired();
                    return this._removeFromLocal(productId);
                }
                if (res.ok) return { status: 'success' };
            } catch (err) {
            }
            return { status: 'error' };
        }
        return this._removeFromLocal(productId);
    },

    _removeFromLocal(productId) {
        const items = this.getLocalItems().filter(i => i.id != productId);
        this.saveLocalItems(items);
        return { status: 'success' };
    },

    async sync() {
        const guestItems = this.getLocalItems();
        if (guestItems.length === 0) return { status: 'empty' };
        try {
            const res = await fetch(`/api/cart/sync`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart: guestItems })
            });
            if (res.status === 401 || res.status === 403) {
                this._handleSessionExpired();
                return { status: 'error' };
            }
            if (res.ok) {
                this.clearLocal();
                return { status: 'success' };
            }
        } catch (err) {
        }
        return { status: 'error' };
    },

    _handleSessionExpired() {
        this._isLoggedIn = false;
        if (this._onExpired) this._onExpired();
    },

    getLocalItems() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch { return []; }
    },
    saveLocalItems(items) {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
    },
    clearLocal() {
        localStorage.removeItem(CART_KEY);
    }
};
