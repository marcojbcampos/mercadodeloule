import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions
} from 'react-native';
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { Ionicons } from '@expo/vector-icons';
import { RFPercentage } from "react-native-responsive-fontsize";

enableScreens();

const { width, height } = Dimensions.get('window');

const USER_NAMES = {
  cguerreiro: 'Carlos Guerreiro',
  lmurtinha: 'Luis Murtinha',
  mcampos: 'Marco Campos',
};

const SEQUENCIA = [
  'Bancas: 82, 83',
  'Loja 1',
  'Loja 2',
  // Other entries
  'Espaço n.º 4',
];

const NOMES = {
  'Banca 82, 83': 'Ramiro António Gonçalves ',
  'Loja 1': 'Maria de Nazaré dos Reis Santos',
  'Loja 2': 'Célia Maria Martins das Neves',
  // Other names
  'Espaço n.º 4': 'BY FAMILY',
};

const corridorMap = {
  'Banca 82, 83': 'Corredor Sul/Nascente',
  'Loja 1': 'Corredor Sul/Nascente',
  'Loja 2': 'Corredor Sul/Nascente',
  // Other mappings
  'Espaço n.º 4': 'Área de Restauração',
};

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const validUsers = [
    { username: 'cguerreiro', password: 'mml1908' },
    { username: 'lmurtinha', password: 'mml1908' },
    { username: 'mcampos', password: 'mml1908' },
  ];

  const handleLogin = () => {
    const userFound = validUsers.find(
      (user) => user.username === username && user.password === password
    );
    if (userFound) {
      const userName = USER_NAMES[userFound.username];
      navigation.navigate('AttendanceScreen', { username: userName });
    } else {
      Alert.alert('Erro', 'Utilizador ou senha incorretos');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome de Utilizador"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const AttendanceScreen = ({ route, navigation }) => {
  const { username } = route.params;
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const dateTime = `${now.toLocaleDateString(
        'pt-PT'
      )} ${now.toLocaleTimeString('pt-PT')}`;
      setCurrentDateTime(dateTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Olá, {username}</Text>
      <Text style={styles.dateTime}>{currentDateTime}</Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('ModoRegistoScreen', { username })}
      >
        <Text style={styles.startButtonText}>Registo de Assiduidade</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.disabledButton} disabled={true}>
        <Text style={styles.disabledButtonText}>Registo de Incumprimento</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.disabledButton} disabled={true}>
        <Text style={styles.disabledButtonText}>Contactos</Text>
      </TouchableOpacity>
    </View>
  );
};

const ModoRegistoScreen = ({ route, navigation }) => {
  const { username } = route.params;
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [completedBy, setCompletedBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAttendanceStatusForCorridors();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAttendanceStatusForCorridors();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAttendanceStatusForCorridors = async () => {
    setLoading(true);
    const corridors = [
      'Corredor Sul/Poente',
      'Corredor Sul/Central',
      'Corredor Sul/Nascente',
      'Corredor Norte/Nascente',
      'Corredor Norte/Central',
      'Corredor Norte/Poente',
      'Área de Restauração',
    ];
    const currentDay = new Date().getDate();

    let statusUpdates = {};
    let completedByMap = {
      MC: 'Marco Campos',
      LM: 'Luis Murtinha',
      CG: 'Carlos Guerreiro',
    };

    try {
      const url = `https://script.google.com/macros/s/AKfycbwFXL9TlYOTaILPD0hT-tjn5BycAWxhe10Gfo8IgF-Vg51hJVpGkBR5RCFVNYv0LOtd/exec?day=${currentDay}&corridors=${encodeURIComponent(
        JSON.stringify(corridors)
      )}`;

      const response = await fetch(url);
      const responseText = await response.text();

      Alert.alert(`Response`, `URL: ${url}\n\nResponse: ${responseText}`);

      const data = JSON.parse(responseText);

      for (let corridor of corridors) {
        if (data[corridor] && data[corridor].attendanceCompleted) {
          statusUpdates[corridor] = true;
          if (data[corridor].attendanceCompletedBy) {
            setCompletedBy(
              completedByMap[data[corridor].attendanceCompletedBy] || ''
            );
          }
        } else {
          statusUpdates[corridor] = false;
        }
      }

      setAttendanceStatus((prevStatus) => ({
        ...prevStatus,
        ...statusUpdates,
      }));
    } catch (error) {
      console.error('Error fetching attendance status:', error);
      Alert.alert(
        'Error',
        `Failed to fetch attendance status: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (sequence, title, corridor) => {
    const remainingSequence = sequence.filter(
      (place) => !attendanceStatus[place]
    );

    navigation.navigate('RegistoScreen', {
      sequence: remainingSequence,
      headerTitle: title,
      corridor,
      username,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.titleTop}>Modo de registo</Text>
      <TouchableOpacity
        style={[
          styles.rondaButton,
          Object.keys(attendanceStatus).some((place) => attendanceStatus[place])
            ? styles.greenButton
            : styles.redButton,
        ]}
        onPress={() =>
          handlePress(SEQUENCIA, 'Ronda Completa', 'Ronda Completa')
        }
      >
        <Text style={styles.rondaButtonText}>Ronda</Text>
      </TouchableOpacity>
      <Text style={styles.subTitle}>Corredores</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.tallButton,
            attendanceStatus['Corredor Norte/Poente']
              ? styles.greenButton
              : styles.redButton,
          ]}
          onPress={() =>
            handlePress(
              [
                'Banca 41',
                'Banca 42',
                // Other entries
                'Loja 26',
              ],
              'Corredor Norte/Poente',
              'Corredor Norte/Poente'
            )
          }
        >
          <Text style={styles.buttonText}>Norte Poente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tallButton,
            attendanceStatus['Corredor Norte/Central']
              ? styles.greenButton
              : styles.redButton,
          ]}
          onPress={() =>
            handlePress(
              [
                'Banca 15, 16, 17',
                // Other entries
                'Banca 40',
              ],
              'Corredor Norte/Central',
              'Corredor Norte/Central'
            )
          }
        >
          <Text style={styles.buttonText}>Norte Central</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tallButton,
            attendanceStatus['Corredor Norte/Nascente']
              ? styles.greenButton
              : styles.redButton,
          ]}
          onPress={() =>
            handlePress(
              [
                'Banca 3',
                'Banca 4',
                // Other entries
                'Loja 14',
              ],
              'Corredor Norte/Nascente',
              'Corredor Norte/Nascente'
            )
          }
        >
          <Text style={styles.buttonText}>Norte Nascente</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.smallSquareButton,
          attendanceStatus['Área de Restauração']
            ? styles.greenButton
            : styles.redButton,
        ]}
        onPress={() =>
          handlePress(
            ['Espaço n.º 1', 'Espaço n.º 2', 'Espaço n.º 3', 'Espaço n.º 4'],
            'Espaços Restauração',
            'Área de Restauração'
          )
        }
      >
        <Text style={styles.buttonText}>Praça Central</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.tallButton,
            attendanceStatus['Corredor Sul/Poente']
              ? styles.greenButton
              : styles.redButton,
          ]}
          onPress={() =>
            handlePress(
              [
                'Banca 56, 71',
                'Banca 57, 58',
                // Other entries
                'Banca 63',
              ],
              'Corredor Sul/Poente',
              'Corredor Sul/Poente'
            )
          }
        >
          <Text style={styles.buttonText}>Sul Poente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tallButton,
            attendanceStatus['Corredor Sul/Central']
              ? styles.greenButton
              : styles.redButton,
          ]}
          onPress={() =>
            handlePress(
              [
                'Banca 64',
                'Banca 65',
                // Other entries
                'Banca 81',
              ],
              'Corredor Sul/Central',
              'Corredor Sul/Central'
            )
          }
        >
          <Text style={styles.buttonText}>Sul Central</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tallButton,
            attendanceStatus['Corredor Sul/Nascente']
              ? styles.greenButton
              : styles.redButton,
          ]}
          onPress={() =>
            handlePress(
              [
                'Banca 82, 83',
                // Other entries
                'Loja 7',
              ],
              'Corredor Sul/Nascente',
              'Corredor Sul/Nascente'
            )
          }
        >
          <Text style={styles.buttonText}>Sul Nascente</Text>
        </TouchableOpacity>
      </View>

      {completedBy ? (
        <Text style={styles.completedByText}>
          Assiduidade feita por: {completedBy}
        </Text>
      ) : null}
    </ScrollView>
  );
};

const RegistoScreen = ({ route, navigation }) => {
  const { sequence, corridor, username } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxIndexReached, setMaxIndexReached] = useState(0);
  const [faltas, setFaltas] = useState({});
  const [presencas, setPresencas] = useState({});
  const [selections, setSelections] = useState({});

  const currentPlace = sequence[currentIndex] || '';
  const nome = NOMES[currentPlace] || 'Nome não encontrado';  // Ensure this is a string
  const corridorName = corridorMap[currentPlace] || corridor || '';

  useEffect(() => {
    console.log(`currentPlace: ${currentPlace}, nome: ${nome}`); // Debugging log
  }, [currentPlace]);

  const handlePressFalta = () => {
    setFaltas((prevFaltas) => ({
      ...prevFaltas,
      [currentPlace]: 1,
    }));
    setSelections((prevSelections) => ({
      ...prevSelections,
      [currentPlace]: 'falta',
    }));
    moveForward();
  };

  const handlePressPresente = () => {
    setPresencas((prevPresencas) => ({
      ...prevPresencas,
      [currentPlace]: 1,
    }));
    setSelections((prevSelections) => ({
      ...prevSelections,
      [currentPlace]: 'presente',
    }));
    moveForward();
  };

  const moveForward = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < sequence.length) {
      setCurrentIndex(nextIndex);
      setMaxIndexReached(Math.max(maxIndexReached, nextIndex));
    } else {
      navigation.navigate('SummaryScreen', {
        faltas,
        presencas,
        corridor,
        username,
      });
    }
  };

  const moveBackward = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const selection = selections[currentPlace];

  return (
    <View style={styles.container}>
      {/* Displaying Texts */}
      <Text style={styles.corridor}>{String(corridorName)}</Text> {/* Ensure it's a string */}
      <Text style={styles.nome}>{String(nome)}</Text> {/* Ensure it's a string */}
      <Text style={styles.bancaTitle}>{String(currentPlace)}</Text> {/* Ensure it's a string */}

      {/* Displaying the Buttons Below the Text */}
      <View style={styles.fullWidthButtons}>
        <TouchableOpacity
          style={[styles.fullWidthButton, styles.faltaButton]}
          onPress={handlePressFalta}
        >
          <Text style={styles.buttonText}>Falta</Text>
          {selection === 'falta' && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="white"
              style={styles.checkmark}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fullWidthButton, styles.presenteButton]}
          onPress={handlePressPresente}
        >
          <Text style={styles.buttonText}>Presente</Text>
          {selection === 'presente' && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="white"
              style={styles.checkmark}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};





const SummaryScreen = ({ route, navigation }) => {
  const { faltas, presencas, corridor, username } = route.params;

  const scriptURL =
    'https://script.google.com/macros/s/AKfycbx24YwpRLEyhBFLZ-CxuHrhUFk51gag5BllQJh2FcW7ToHserqUeSLXqg65JWzBLRhM/exec';

  const handleSendData = async () => {
    const data = {
      mes: new Date().toLocaleString('default', { month: 'long' }),
      dia: new Date().getDate(),
      faltas: Object.keys(faltas).map((key) => ({
        concessionario: NOMES[key],
        dia: new Date().getDate(),
        reason: faltas[key]
      })),
      corridor: corridor,
      username: username,
    };

    try {
      const response = await fetch(scriptURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.text();
      Alert.alert('Server Response', result);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', `Failed to send attendance data: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo do Dia</Text>
      <Text style={styles.summaryText}>
        Faltas Lojas: {countType('Loja', faltas)}
      </Text>
      <Text style={styles.summaryText}>
        Faltas Bancas: {countType('Banca', faltas)}
      </Text>
      <Text style={styles.summaryText}>
        Faltas Totais: {Object.values(faltas).reduce((sum, curr) => sum + (curr === 1 || curr === 'DE' || curr === 'FE' ? 1 : 0), 0)}
      </Text>
      <Text style={styles.summaryText}>
        Presenças Lojas: {countType('Loja', presencas)}
      </Text>
      <Text style={styles.summaryText}>
        Presenças Bancas: {countType('Banca', presencas)}
      </Text>
      <Text style={styles.summaryText}>
        Presenças Totais:{' '}
        {Object.values(presencas).reduce((sum, curr) => sum + curr, 0)}
      </Text>
      <TouchableOpacity style={styles.sendButton} onPress={handleSendData}>
        <Text style={styles.sendButtonText}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
};

const countType = (type, counts) =>
  Object.keys(counts)
    .filter((key) => key.includes(type))
    .reduce((sum, key) => {
      const value = counts[key];
      return sum + (value === 1 || value === 'DE' || value === 'FE' ? 1 : 0);
    }, 0);

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />
        <Stack.Screen name="ModoRegistoScreen" component={ModoRegistoScreen} />
        <Stack.Screen name="RegistoScreen" component={RegistoScreen} />
        <Stack.Screen name="SummaryScreen" component={SummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
  },
  titleTop: {
    fontSize: RFPercentage(3.5),
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: RFPercentage(2.5),
    marginVertical: height * 0.02,
    textAlign: 'center',
  },
  greeting: {
    fontSize: RFPercentage(2.5),
    color: 'black',
  },
  dateTime: {
    fontSize: RFPercentage(2),
    color: 'black',
  },
  startButton: {
    marginTop: height * 0.05,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.3,
    backgroundColor: 'blue',
    borderRadius: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: RFPercentage(2.5),
  },
  disabledButton: {
    marginTop: height * 0.02,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.3,
    backgroundColor: 'gray',
    borderRadius: 5,
  },
  disabledButtonText: {
    color: 'darkgray',
    fontSize: RFPercentage(2.5),
  },
  rondaButton: {
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.3,
    borderRadius: 5,
  },
  rondaButtonText: {
    color: 'white',
    fontSize: RFPercentage(2.5),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: height * 0.01,
  },
  tallButton: {
    flex: 1,
    marginHorizontal: '1%',
    paddingVertical: height * 0.1,
    borderRadius: 5,
  },
  smallSquareButton: {
    marginVertical: height * 0.03,
    padding: width * 0.05,
    borderRadius: 5,
    width: '30%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: RFPercentage(2.5),
    textAlign: 'center',
  },
  fullWidthButtons: {
    flexDirection: 'row',
    width: '100%',
    height: '50%', // Adjust to make the buttons take half of the screen height
  },
  fullWidthButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faltaButton: {
    backgroundColor: 'red',
  },
  presenteButton: {
    backgroundColor: 'green',
  },
  corridor: {
    fontSize: RFPercentage(3.5),
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  nome: {
    fontSize: RFPercentage(3),
    color: 'black',
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  bancaTitle: {
    fontSize: RFPercentage(2.5),
    color: 'black',
    textAlign: 'center',
    marginBottom: height * 0.05,
  },

  overlayTextContainerLeft: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
  },
  overlayTextContainerRight: {
    position: 'absolute',
    top: height * 0.05,
    right: width * 0.05,
  },
  overlayText: {
    color: 'white',
    fontSize: RFPercentage(2),
  },
  summaryText: {
    fontSize: RFPercentage(2.5),
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  sendButton: {
    marginTop: height * 0.05,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.3,
    backgroundColor: 'blue',
    borderRadius: 5,
  },
  sendButtonText: {
    color: 'white',
    fontSize: RFPercentage(2.5),
  },
  arrowLeft: {
    position: 'absolute',
    bottom: height * 0.01,
    left: '10%',
  },
  arrowRight: {
    position: 'absolute',
    bottom: height * 0.01,
    right: '10%',
  },
  checkmark: {
    marginTop: height * 0.01,
  },
  input: {
    width: '100%',
    padding: width * 0.03,
    marginBottom: height * 0.02,
    borderColor: 'gray',
    borderWidth: 1,
    fontSize: RFPercentage(2.5),
  },
  loginButton: {
    marginTop: height * 0.05,
    backgroundColor: 'blue',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.3,
    borderRadius: 5,
  },
  loginButtonText: {
    color: 'white',
    fontSize: RFPercentage(2.5),
  },
  redButton: {
    backgroundColor: 'red',
  },
  greenButton: {
    backgroundColor: 'green',
  },
  completedByText: {
    marginTop: height * 0.03,
    fontSize: RFPercentage(2.5),
    color: 'black',
    textAlign: 'center',
  },
  overlayButtonContainer: {
    position: 'absolute',
    top: height * 0.35,
    left: '10%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  overlayButton: {
    backgroundColor: '#007bff',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.05,
    borderRadius: 5,
    marginRight: width * 0.02,
    alignItems: 'center',
  },
  overlayButtonText: {
    color: 'white',
    fontSize: RFPercentage(2),
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default App;
