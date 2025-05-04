import React, { useEffect, useState } from 'react';
import { Table, Spinner, Badge, Button } from 'flowbite-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;

    fetch("http://localhost:5000/my-book-orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.orders) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des commandes", err);
        setOrders([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDeliver = async (orderId) => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;

    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/deliver`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        alert('✅ Commande marquée comme livrée');
        fetchOrders(); // recharge les données
      } else {
        alert('❌ Erreur : ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-20">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-24 my-16">
      <h2 className="text-3xl font-bold text-center mb-8">Commandes de mes livres</h2>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">Aucune commande trouvée.</p>
      ) : (
        <Table hoverable striped>
          <Table.Head>
            <Table.HeadCell>Client</Table.HeadCell>
            <Table.HeadCell>Mode d'achat</Table.HeadCell>
            <Table.HeadCell>Montant</Table.HeadCell>
            <Table.HeadCell>Date</Table.HeadCell>
            <Table.HeadCell>Statut</Table.HeadCell>
            <Table.HeadCell>Action</Table.HeadCell>
          </Table.Head>

          <Table.Body className="divide-y">
            {orders.map((order) => (
              <Table.Row key={order.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell>{order.client_name}</Table.Cell>
                <Table.Cell>
                  <Badge color={order.mode_achat === 'en ligne' ? 'info' : 'success'}>
                    {order.mode_achat}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{order.total_amount} €</Table.Cell>
                <Table.Cell>{new Date(order.created_at).toLocaleDateString()}</Table.Cell>
                <Table.Cell>
                  <Badge color={
                    order.status === 'Livrée' ? 'success' :
                    order.status === 'En cours' ? 'warning' : 'gray'
                  }>
                    {order.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {order.status === 'pending' && (
                    <Button size="xs" color="success" onClick={() => handleDeliver(order.id)}>
                      Délivrer
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
